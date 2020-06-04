// Client ID and API key from the Developer Console
var CLIENT_ID = "889110302295-9k0a7oebgibkmv3b3ihbpva02nbhrjo7.apps.googleusercontent.com"
var API_KEY = "AIzaSyC8AKOJu5DVuEVVwO3S3t9x84rjg4lwI_A"

// Array of API discovery doc URLs for APIs used to interact with sheets
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces. (Spreadsheets and accessing user profile).
var SCOPES = "https://www.googleapis.com/auth/spreadsheets" +
    " https://www.googleapis.com/auth/userinfo.profile";

var LDP_SPREADSHEET = "1HgidUhkBfzC8_q8vtLHoHEahzKQq4kL_1Ai-4yRpEZI";
var GAR_SPREADSHEET = "1Z9X-TiUZ3W46JT6rWxYJATi0BvcYx8uwuKmzHIbGYnE";
var ATTENDANCE_SPREADSHEET = "1L6ZGAy7jhCCJt_K0drl5PSXlEPVPTRufgnevSmD2idk";

var authorizeButton = document.getElementById('authorize_button');

var GoogleAuth;

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        GoogleAuth = gapi.auth2.getAuthInstance();
        GoogleAuth.isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(GoogleAuth.isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
    }, function (error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        console.log("Signed in!")
        authorizeButton.style.display = 'none';
        displayOptions();
    } else {
        console.log("Not signed In!")
        authorizeButton.style.display = 'block';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    GoogleAuth.signIn();
    console.log(GoogleAuth);
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('attendanceForm');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

/**
 * Creates a new squad html div.
 */
function addSection(sectionName) {
    var pre = document.getElementById('attendanceForm');
    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', "squad");
    newDiv.setAttribute('id', sectionName);
    pre.appendChild(newDiv);
}

/**
 * Creates a new header (The type that says what the squad is)
 */
function addHeader(elementTag, message) {
    var pre = document.getElementById(elementTag);
    var headerContent = document.createElement("HEADER");
    headerContent.innerText = message;
    pre.appendChild(headerContent);
}

/**
 * Creates an attendance option (present, excused, oor, or tardy)
 */
function addAttendanceOption(divName, lastname) {
    console.log("Adding option to squad: " + divName + "For person: " + lastname);
    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', "attOption");
    var fullName = "CDT " + lastname;

    var tab = "\t\t\t";
    if (lastname.length >= 8 && !lastname.includes("Mitchell")) {
        tab = "\t\t";
    }
    newDiv.innerHTML = fullName + ": " + tab + htmlInput("Present", lastname) + htmlInput("Excused", lastname) +
        htmlInput("Out Of Rank", lastname) + htmlInput("Tardy", lastname);
    document.getElementById(divName).appendChild(newDiv);
}

/**
 * Generates the html code for the input (nesting in the label code)
 *
 * @param {string} label: the label to use
 * @param {String} lastname: the lastname of the Cadet
 */
function htmlInput(label, lastname) {
    var checked = "";
    if (label === "Present") {
        checked = "checked";
    }
    return "<input type='radio' id='" + label + "' name='" + lastname + "' " + checked + " value='" + label + "'>" +
        htmlLabel(label) + "";
}

/**
 * Generates the htmlLabel code
 *
 * @param {String} label: the label to be created.
 */
function htmlLabel(label) {
    return "<label class='radioButt' for='" + label + "'>" + label + "</label>";
}

/** Helper function to determine which radio button is checked */
function getChecked(radios) {
    let map = new Map();
    for (let radio of radios) {
        var checked = radio.checked;
        if (checked) {
            map.set(radio.getAttribute("name"), radio.getAttribute("value"));
            console.log(radio.getAttribute("name") + " is marked " + radio.getAttribute("value"));
        }
    }
    return map;
}

/**
 * Used when the submit form button is pressed. (Not incredibly optimized)
 */
function submitForm() {
    console.log("Attempting to submit form.")
    var form = document.getElementById("attendanceForm");
    var radios;
    if (form !== null) {
        radios = form.getElementsByTagName("input");
    }
    var checkedNames = getChecked(radios);
    let dateBut = document.getElementsByClassName("dropDownBut")[0];
    console.log("DATE STR: " + dateBut.value);
    let date = new Date(dateBut.value);
    console.log(date);
    console.log("Converting date " & date & " to \n" & date.getDate());
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: ATTENDANCE_SPREADSHEET,
        range: 'FALL2020!D1:CC22'
    }).then(function (response) {
        var result = response.result;
        var dateCol = 0;
        var dd = String(date.getDate()).padStart(2, '0');
        var mm = String(date.getMonth() + 1).padStart(2, '0');
        let today = mm + '/' + dd;
        var row1 = result.values[0];
        for (dateCol; dateCol < row1.length; dateCol++) {
            if (row1[dateCol].includes(today)) {
                console.log("Date found in the " + dateCol + " spot");
                break;
            }
        }
        for (let name of checkedNames.keys()) {
            console.log("checking name: " + name);
            for (i = 0; i < result.values.length; i++) {
                var checkName = result.values[i][0];//The name being checked
                if (checkName === undefined) {
                    break;
                }
                if (checkName.includes(name)) {
                    var colLetter = columnToLetter(dateCol + 4);
                    var range = 'FALL2020!' + colLetter + (i + 1)
                    console.log("Submitting to the range: " + range);
                    gapi.client.sheets.spreadsheets.values.update({
                        spreadsheetId: ATTENDANCE_SPREADSHEET,
                        range: range,
                        valueInputOption: 'RAW',
                        includeValuesInResponse: true,
                        values: [[checkedNames.get(name).charAt(0)]]
                    }).then(function (response) {
                        console.log(response);
                    })
                }
            }
        }
        window.location.replace("/submission.html")
    })
}

/**
 * Helper function that changes a column number to letter for Google 'A1' notation
 * @param column: the column index
 * @returns {string} the 'A1' column letter.
 */
function columnToLetter(column) {
    var temp, letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}

/**
 * Helper function uesd to create a submit btuton
 */
function makeSubmitButton() {
    console.log("Creating submit button.")
    var pre = document.getElementById("content");
    var newDiv = document.createElement("div");
    newDiv.setAttribute("class", "buttonDiv");
    var newButton = document.createElement("BUTTON");
    newButton.setAttribute("class", "submitButton");
    newButton.innerHTML = "Submit Attendance";
    newButton.id = "submitBut";
    newButton.setAttribute("type", '"button"')
    newButton.addEventListener("click", submitForm);
    newDiv.appendChild(newButton);
    pre.appendChild(newDiv);
}

/**
 * Used to only get the first half of an email.
 *
 * @param {string} email: the email to get the substring of
 * @return a string up to the '@' character.
 */
function getUsername(email) {
    var atIndex = email.indexOf('@', 2);
    var username = email.substring(0, atIndex);
    return username;
}

function makeDropDown(dates) {
    console.log("Creating drop down menu")
    console.log(dates);
    var pre = document.getElementById("content");
    var newDiv = document.createElement("div");
    newDiv.setAttribute("class", "dropdown");
    let newDropDown = document.createElement("BUTTON");
    newDropDown.setAttribute("class", "dropDownBut");
    newDropDown.setAttribute("id", "dropDownBut");
    newDropDown.innerHTML = "<span>Select Date</span>";
    newDropDown.value = "Select Date";
    var innerDiv = document.createElement("div");
    innerDiv.setAttribute("class", "dropdownContent");
    for (let date of dates) {
        if (date.valueOf() !== "") {
            let a = document.createElement('a');
            let link = document.createTextNode(date.valueOf());
            a.href = "#";
            a.setAttribute("onclick", "'changedate(" & date.valueOf() & "); return false;'")
            a.onclick = function () {
                changeDate(date.valueOf());
            };
            a.appendChild(link);
            innerDiv.appendChild(a);
        }
    }
    newDropDown.appendChild(innerDiv);
    newDiv.appendChild(newDropDown);
    pre.appendChild(newDiv);
}

function addDates(name) {
    console.log("Adding dates")
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: LDP_SPREADSHEET,
        range: 'MS3!C3:Z17'
    }).then(function (response) {
        let rotations = [];
        let result = response.result;
        for (i = 2; i < 17; i = i + 8) {
            let row = result.values[i];
            for (j = 0; j < row.length; j++) {
                let lastName = row[j];
                if (name === lastName) {
                    rotations.push(j + 1);
                }
            }
        }
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: LDP_SPREADSHEET,
            range: 'INFO!E12:AB38'
        }).then(function (response) {
            let result2 = response.result;
            let dates = [];
            for (let rotation in rotations) {
                for (i = 0; i < result2.values.length; i++) {
                    dates.push(result2.values[i][rotation]);
                }
            }
            console.log(dates);
            makeDropDown(dates);
        })
    })
}

/**
 * used to display the options for the attendance.
 */
function displayOptions() {
    var googleUser = GoogleAuth.currentUser.get();
    console.log(googleUser);
    var profile = googleUser.getBasicProfile();
    console.log(profile);
    var last_name = profile.getFamilyName();
    console.log('Last Name: ' + last_name);
    var email = profile.getEmail();
    console.log('Email: ' + email);
    console.log('Username: ' + getUsername(email));

    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: LDP_SPREADSHEET,
        range: 'INFO!A12:B65'
    }).then(function (response) {
        var result = response.result;
        var firstSGT = false;
        for (i = 0; i < result.values.length; i++) {
            var row = result.values[i];
            var position = row[0];
            if (position.includes("1SG")) {
                if (row[1] === last_name && position.includes("A")) {
                    addDates(last_name);
                    addCompany("A Co");
                    firstSGT = true;
                    break;
                } else if (row[1] === last_name && position.includes("B")) {
                    addDates(last_name);
                    addCompany("B Co");
                    firstSGT = true;
                    break;
                } else if (row[1] === last_name && position.includes("C")) {
                    addDates(last_name);
                    addCompany("C Co");
                    firstSGT = true;
                    break;
                }
            }
        }
        if (!firstSGT) {
            console.log("No 1SG Found");
            var pre = document.getElementById("content");
            pre.innerText = "You are not currently 1SG or are not the previous rotation's 1SG";
        }
    })
}

function changeDate(date) {
    console.log("Attempting to change date to: " + date);
    var pre = document.getElementById("dropDownBut");
    let spanDate = pre.firstChild;
    pre.value = date;
    spanDate.innerHTML = date;
    if (!document.getElementById("submitBut")) {
        console.log(document.getElementsByClassName("submitButton"));
        makeSubmitButton();
    }
}

/**
 * Adds the company to the webpage. IMPORTANT. The google sheet format must be something along the lines of
 * >SQD
 * >MS3
 * >MS2
 * >MS1
 * If the SQD is not first this is why the code breaks.
 *
 * @param {string} company: the company that is being added.
 */
function addCompany(company) {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: GAR_SPREADSHEET,
        range: company + '!A1:L40'
    }).then(function (response) {
        var form = document.createElement("FORM");
        form.setAttribute("id", "attendanceForm");
        form.setAttribute("action", "javascript:;");
        var pre = document.getElementById("content");
        pre.appendChild(form);
        var result = response.result;
        let squad = "";
        for (i = 0; i < result.values.length; i++) {
            var row = result.values[i];
            var cell = row[0];
            console.log("Checking Cell, val: " + cell);
            if (typeof cell !== 'undefined') {
                if (cell.includes("MS")) {
                    console.log(row);
                    for (j = 1; j < row.length; j++) {
                        console.log("Found name: " + row[j]);
                        addAttendanceOption(squad, row[j]);
                    }
                } else if (cell.includes(company.charAt(0))) {
                    console.log("Section created: " + squad);
                    squad = cell;
                    addSection(squad);
                    addHeader(squad, squad);
                }
            }
        }
        appendPre("");
    })
}
