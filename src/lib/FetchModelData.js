var Promise = require("Promise");

(function () {
  function fetchModel(url) {
    return new Promise(function (resolve, reject) {
      console.log("Fetching data from: ", url);

      const request = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          resolve({ data: JSON.parse(this.responseText) });
        }
        this.onerror = () =>
          setTimeout(
            () =>
              reject(
                new Error({ status: this.status, statusText: this.statusText })
              ),
            0
          );
      };

      request.open("GET", url, true);
      request.send();
    });
  }

  var server = {
    fetchModel: fetchModel,
  };

  if (typeof exports !== "undefined") {
    exports.server = server;
  } else {
    window.server = server;
  }
})();
