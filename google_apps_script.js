/**
 * INSTRUCTIONS:
 * 1. Open your Google Spreadsheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this script.
 * 4. Click "Deploy" > "New Deployment".
 * 5. Select type "Web App".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone" (This is required for the PWA to send data).
 * 8. Click "Deploy", authorize the script, and COPY the "Web App URL".
 * 9. Paste that URL into the `WEBHOOK_URL` variable in your `app.js` file (around line 381).
 */

function doPost(e) {
  try {
    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Determine which sheet to use
    // Matches the "SheetName" field we added in app.js
    var sheetName = data.SheetName || (data.Type === 'screening' ? 'Sheet1' : 'Sheet2');
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput("Error: Sheet '" + sheetName + "' not found.")
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // 2. Map the data to your existing headers
    // This looks at the first row of your sheet to know where each value goes.
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var newRow = headers.map(function(header) {
      // Return the value if the key exists in our data, otherwise return empty string
      return data[header] !== undefined ? data[header] : "";
    });
    
    // 3. Append the row to the sheet
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
