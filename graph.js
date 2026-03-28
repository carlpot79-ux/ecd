const msalConfig = {
    auth: {
        clientId: "cb1ff984-d56c-48ab-b4c5-5b9be0c776e0",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.href.split('?')[0].split('#')[0]
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    }
};

const loginRequest = {
    scopes: ["User.Read", "Files.ReadWrite"]
};

// ==========================================
// EXCEL CONFIGURATION (Change these to match your exact files!)
// ==========================================
const EXCEL_FILENAME = "ScreeningData.xlsx";
const EXCEL_TABLENAME = "Table1";

const msalInstance = new msal.PublicClientApplication(msalConfig);
let accountId = "";

async function signInOneDrive() {
    try {
        await msalInstance.initialize();
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        accountId = loginResponse.account.homeAccountId;
        return loginResponse.account;
    } catch (err) {
        console.error("Login Error: ", err);
        return null;
    }
}

async function getAccessToken() {
    const request = {
        scopes: loginRequest.scopes,
        account: msalInstance.getAccountByHomeId(accountId)
    };
    try {
        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        // Fallback to popup if silent acquisition fails
        const response = await msalInstance.acquireTokenPopup(request);
        return response.accessToken;
    }
}

async function addRowToExcel(record) {
    const token = await getAccessToken();
    const endpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/${EXCEL_FILENAME}:/workbook/tables/${EXCEL_TABLENAME}/rows/add`;
    
    // Ordered to match: Date, Screener Name, Creche, Screened, Caries Free, Abscess, Initial Caries
    const rowValues = [
        [
            new Date(record.date).toLocaleDateString(),
            record.screener,
            record.creche,
            record.screened,
            record.cariesFree,
            record.abscess,
            record.initialCaries
        ]
    ];

    const body = {
        "index": null,
        "values": rowValues
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errDetails = await response.json();
        console.error("API Error: ", errDetails);
        throw new Error("Could not add row to Excel");
    }
    return await response.json();
}
