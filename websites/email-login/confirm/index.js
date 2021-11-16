let alreadyDone = false;

document.onreadystatechange = () => {
   if (alreadyDone) {
      return;
   }
   alreadyDone = true;

   const { hash, appUrl } = getJsonFromUrl();
   const statusText = document.querySelector(".section1-text");
   const buttonBackToApp = document.querySelector(".section1-go-to-app-button");

   buttonBackToApp.addEventListener("click", () => {
      window.location.href = appUrl;
   });

   buttonBackToApp.style.opacity = 0;
   statusText.innerHTML = "Cargando...";

   const successText = "<b>¡Email confirmado!</b> Puedes volver a la app";
   const generalErrorText =
      "<b>Error:</b><br/>Este no es el link que te enviamos en el email, comprueba si lo has abierto correctamente";

   if (!hash || hash.length < 4) {
      statusText.innerHTML = generalErrorText;
      return;
   }

   fetch("/api/email-login/confirm-email", {
      method: "POST",
      body: JSON.stringify({ hash }),
      headers: {
         "Content-Type": "application/json",
      },
   })
      .then(response => {
         if (!response.ok) {
            throw new Error(response.statusText);
         }
         return response.json();
      })
      .then(response => {
         if (response.success === true) {
            statusText.innerHTML = successText;
            buttonBackToApp.style.opacity = 1;
         }
      })
      .catch(err => {
         statusText.innerHTML = `${generalErrorText}.<br/>${tryToGetErrorMessage(err)}`;
         buttonBackToApp.style.opacity = 1;
         return;
      });
};

function getJsonFromUrl(url) {
   if (!url) url = location.href;
   var question = url.indexOf("?");
   var hash = url.indexOf("#");
   if (hash == -1 && question == -1) return {};
   if (hash == -1) hash = url.length;
   var query = question == -1 || hash == question + 1 ? url.substring(hash) : url.substring(question + 1, hash);
   var result = {};
   query.split("&").forEach(function (part) {
      if (!part) return;
      part = part.split("+").join(" "); // replace every + with space, regexp-free version
      var eq = part.indexOf("=");
      var key = eq > -1 ? part.substr(0, eq) : part;
      var val = eq > -1 ? decodeURIComponent(part.substr(eq + 1)) : "";
      var from = key.indexOf("[");
      if (from == -1) result[decodeURIComponent(key)] = val;
      else {
         var to = key.indexOf("]", from);
         var index = decodeURIComponent(key.substring(from + 1, to));
         key = decodeURIComponent(key.substring(0, from));
         if (!result[key]) result[key] = [];
         if (!index) result[key].push(val);
         else result[key][index] = val;
      }
   });
   return result;
}

function tryToGetErrorMessage(error) {
   if (error == null) {
      return "";
   }

   if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
   }

   if (error.response?.data?.[0]?.message != null) {
      return error.response.data[0].message;
   }

   if (error.response?.data != null) {
      return error.response.data;
   }

   if (error.response != null) {
      return error.response;
   }

   if (error.message != null) {
      return error.message;
   }

   return "No information found";
}
