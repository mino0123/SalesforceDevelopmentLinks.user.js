// ==UserScript==
// @name           SalesforceDevelopmentLinks
// @description    Salesforceの画面(ApexClass,VisualforcePage)に開発者向けのリンクを追加します。
// @include        *.salesforce.com/*
// ==/UserScript==


(function(pathname, doc){

  var sforce;

  var Label = {
    test: "テスト"
  };

  var ActionSeparator = " | ";

  // Apex Class
  if ("/01p" === pathname) {
    var cells = document.querySelectorAll(".actionColumn");
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var nsPrefix = getNameSpacePrefix(cell);
      var id = getParameterFromChildlen(cell, "id");
      var apexName = getParameterFromChildlen(cell, "apex_name");
      if (!id || !apexName) {
        continue;
      }
      cell.appendChild(doc.createTextNode(ActionSeparator));
      cell.appendChild(createTestLink(id, apexName, nsPrefix));
    }
  }

  // ページ一覧画面の表示件数を増やす
  var linkToPages = doc.getElementById("ApexPages_font");
  if (linkToPages) {
    linkToPages.href = "/066?" + encodeURIComponent("j_id0:theTemplate:j_id8:rowsperpage") + "=100";
  }
  // クラス一覧画面の表示件数を増やす
  var linkToClasses = doc.getElementById("ApexClasses_font");
  if (linkToClasses) {
    linkToClasses.href = "/01p?" + encodeURIComponent("all_classes_page:theTemplate:classList:rowsperpage") + "=100";
  }


  /**
   * 渡されたノードから名前空間プレフィックスを取得します。
   */
  function getNameSpacePrefix(srcCell) {
    var nsCell = srcCell.parentNode.querySelector("td.dataCell");
    if (nsCell) {
      return nsCell.textContent.replace(/[\s]/, '');
    }
  }

  /**
   * 渡されたノード内のa要素のhrefから指定されたパラメータを取得します。
   */
  function getParameterFromChildlen(node, name) {
    var links = node.getElementsByTagName("a");
    for (var i = 0, l; i < links.length; i++) {
      l = links[i];
      var param = getUrlParameter(l.href, name);
      if (param) {
        return param;
      }
    }
  }

  /**
   * URLからGETパラメータを取得します。
   * パラメータが存在しない場合、nullを返します。
   */
  function getUrlParameter(url, name) {
    var tail = url.split(name + "=")[1];
    return (tail ? tail.split("&")[0] : null);
  }

  /**
   * Apexクラスのテストページへのリンク作成
   */
  function createTestLink(id, apexClass, nsPrefix) {
    var elm = doc.createElement("a");
    elm.className = "actionLink";
    elm.href = "/setup/build/runApexTest.apexp?class_id=" + id + "&class_name=" + apexClass + (nsPrefix ? "&ns_prefix=" + nsPrefix : "");
    elm.href = 'javascript: void 0;';
    function onEnd(test) {
      hideLoadingImage();
      var resultElm = createTestResultLink(test.Id);
      elm.parentNode.appendChild(elm, resultElm);
    }
    elm.onclick = function() {
      showLoadingImage(elm);
      runTest(id, onEnd);
    };
    elm.appendChild(doc.createTextNode(Label.test));
    return elm;
  }

  function runTest(classId, callback) {
    sforce = unsafeWindow.sforce;
    var item = new sforce.SObject('ApexTestQueueItem');
    item.ApexClassId = classId;
    sforce.connection.create([item], function (results) {
      checkTestStatus(results[0].id, function (item) {
        callback(item);
        
      });
    });
  }

  function checkTestStatus(id, callback) {
    sforce.connection.query("select Id, Status from ApexTestQueueItem where Id = '" + id + "'", function (qr) {
      var record = qr.getArray('records')[0],
          id = record.Id,
          status = record.Status;
      if (status === 'Completed') {
        callback(record);
        return;
      }
      if (status === 'Failed') {
        callback(record);
        return;
      }
      setTimeout(function () {
        checkTestStatus(id, callback)
      }, 3000);
    });
  }

  function createTestResultLink(id) {
    var link = document.createElement('a');
    link.href = '/' + id;
    link.textContent = 'result';
    return link;
  }

  var LoadingImage;
  function showLoadingImage(target) {
    var img = document.createElement('img');
    img.src = '/img/loading.gif';
    target.parentNode.appendChild(img);
    LoadingImage = img;
  }
  function hideLoadingImage() {
    LoadingImage.parentNode.removeChild(LoadingImage);
  }

})(location.pathname, document);