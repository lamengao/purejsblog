function checkPassword(pwd){
  if (pwd === 'yourpassword')
    return true;
  else
    return false;
}

function submitHandler() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var lastRowIndex = sheet.getLastRow();
  var submitNum = getTotalSubmitTimesRange().getValue();
  var passwordRange = getPasswordRange(sheet, lastRowIndex)
  var password = passwordRange.getValue();
  if (!checkPassword(password)){
    sheet.deleteRow(lastRowIndex);
    return ;
  }
  // clean the password
  passwordRange.clear();
  
  // check add new post or edit post
  var postIdRange = getPostIdRange(sheet, lastRowIndex);
  var postId = postIdRange.getValue();
  if (postId != ''){
    var postObj = getPostObj(sheet, lastRowIndex);
    sheet.deleteRow(lastRowIndex);
    if (isNumOrNumStr(postId)){
      // edit post by row number
      postId = parseInt(postId);
      if (postId > 1 && postId <= parseInt(submitNum)){
        if (postObj.title == '' && postObj.content == ''){
          // delete post by postId
          sheet.deleteRow(lastRowIndex);
          deletePost(postId);
        } else{
          editPost(postId, postObj);
          sheet.deleteRow(lastRowIndex);
        }
      }
    }
  } else{
    postIdRange.setValue(makePostId());
  }
}

function getPostRowIndexById(postId){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var maxRowNum = sheet.getMaxRows();
  for (var i = 2; i <= maxRowNum; i++){
    if (getPostIdRange(sheet, i).getValue() == postId)
      return i;
  }
  return 0;
}

function editPost(id, postObj){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var postRowIndex = getPostRowIndexById(id);
  if (postRowIndex){
    getTitleRange(sheet, postRowIndex).setValue(postObj.title);
    getContentRange(sheet, postRowIndex).setValue(postObj.content);
  }
}

function deletePost(id){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var postRowIndex = getPostRowIndexById(id);
  if (postRowIndex){
    sheet.deleteRow(postRowIndex);
  }
}

function newPost(){
}

function getLastPost(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var lastRowIndex = sheet.getLastRow();
  return lastRowIndex;
}

function getPostObj(sheet, rowIndex){
  var obj = {};
  obj.title = getTitleRange(sheet, rowIndex).getValue();
  obj.content = getContentRange(sheet, rowIndex).getValue();
  return obj;
}

function getPasswordRange(sheet, rowIndex){
  var passwordRange = sheet.getRange("E" + rowIndex);
  return passwordRange;
}

function getPasswordColumnRange(sheet){
  var maxRowNum = sheet.getMaxRows();
  var passwordColumnRange = sheet.getRange("E2:E" + maxRowNum);
  return passwordColumnRange;
}

function getPostIdRange(sheet, rowIndex){
  var postIdRange = sheet.getRange("D" + rowIndex);
  return postIdRange;
}

function getTitleRange(sheet, rowIndex){
  var titleRange = sheet.getRange("B" + rowIndex);
  return titleRange;
}

function getContentRange(sheet, rowIndex){
  var ContentRange = sheet.getRange("C" + rowIndex);
  return ContentRange;
}

function getTotalSubmitTimesRange(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[1];
  return sheet.getRange("A2");
}  

function makePostId(){
  var totalSubmitTimesRange = getTotalSubmitTimesRange();
  var newPostId = totalSubmitTimesRange.getValue() + 1;
  totalSubmitTimesRange.setValue(newPostId);
  return newPostId;
}

function isNumOrNumStr(val){
  if (typeof val == 'number')
    return true;
  if (typeof val == 'string' && /^(\d+)$/.test(val)){
    return true;
  }
  
  return false;
}

function clearAllPassword(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var maxRowNum = sheet.getMaxRows();
  var passwordColumnRange = getPasswordColumnRange(sheet);
  passwordColumnRange.clear();
}