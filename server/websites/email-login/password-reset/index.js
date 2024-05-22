let alreadyDone = false;

document.onreadystatechange = () => {
   if (alreadyDone) {
      return;
   }
   alreadyDone = true;

   let passwordChanged = false;

   const { hash, appUrl } = getJsonFromUrl();
   const statusText = document.querySelector(".section1-text");
   const buttonContinue = document.querySelector(".section1-main-button");
   const buttonBackToApp = document.querySelector(".back-to-app");
   const form = document.querySelector(".section1-form");
   const passwordInput = document.querySelector(".password-input1");
   const confirmPasswordInput = document.querySelector(".password-input2");
   const errorLabel = document.querySelector(".error-label");
   errorLabel.style.display = "none";
   buttonBackToApp.style.display = "none";

   passwordInput.addEventListener("keyup", event => {
      if (event.keyCode === 13) {
         event.preventDefault();
         confirmPasswordInput.focus();
         confirmPasswordInput.scrollIntoView();
      }
   });

   confirmPasswordInput.addEventListener("keyup", event => {
      if (event.keyCode === 13) {
         event.preventDefault();
         buttonContinue.scrollIntoView();
         buttonContinue.click();
      }
   });

   buttonContinue.addEventListener("click", sendNewPassword);
   buttonBackToApp.addEventListener("click", () => (window.location.href = appUrl));

   statusText.innerHTML = "Nuevo password";

   if (!hash || hash.length < 4) {
      statusText.innerHTML =
         "<b>Error:</b><br/>Este no es el link que te enviamos en el email, comprueba si lo has abierto correctamente";
      form.style.display = "none";
      return;
   }

   form.style.opacity = 1;

   function sendNewPassword() {
      errorLabel.innerHTML = "";
      errorLabel.style.display = "none";

      if (passwordInput.value.trim() !== confirmPasswordInput.value.trim()) {
         errorLabel.innerHTML = "Error: Los passwords no coinciden";
         errorLabel.style.display = "block";
         return;
      }

      if (passwordInput.value.trim().length < 2) {
         errorLabel.innerHTML = "Error: El password debe tener al menos 2 caracteres";
         errorLabel.style.display = "block";
         return;
      }

      statusText.innerHTML = "Enviando...";
      form.style.display = "none";

      fetch("/api/email-login/change-password", {
         method: "POST",
         body: JSON.stringify({ hash, newPassword: passwordInput.value.trim() }),
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
               statusText.innerHTML = "<b>Password modificado!</b> Inicia sesión con tu nuevo password";
               buttonBackToApp.style.display = "block";
               passwordChanged = true;
            }
         })
         .catch(err => {
            statusText.innerHTML = "";
            errorLabel.innerHTML = `Error: ${tryToGetErrorMessage(err)}`;
            errorLabel.style.display = "block";
            form.style.display = "block";
            return;
         });
   }
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

   try {
      if (error.response.data.error.message) {
         return error.response.data.error.message;
      }
   } catch (e) {}

   try {
      if (error.response.data[0].message != null) {
         return error.response.data[0].message;
      }
   } catch (e) {}

   try {
      if (error.response.data != null) {
         return error.response.data;
      }
   } catch (e) {}

   try {
      if (error.response != null) {
         return error.response;
      }
   } catch (e) {}

   try {
      if (error.message != null) {
         return error.message;
      }
   } catch (e) {}

   return "No information found";
}