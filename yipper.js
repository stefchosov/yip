"use strict";

/**
 * This yipper.js file provides all the client-side functionality for the yipper webpage to
 * work. It will change between the different page views, make post calls and fetch calls to
 * retrieve any necessary data from the server-side. It is the js file of yipper.html and will
 * perform the necessary functionality for the page
 */
(function() {
  window.addEventListener("load", init);

  /**
   * main method to start the functionality of the page
   */
  function init() {
    prepareYips();
    id("search-btn").addEventListener("click", searchFor);
    id("search-term").addEventListener("keyup", buttonAction);
    id("home-btn").addEventListener("click", resetPages);
    id("yip-btn").addEventListener("click", makeNewYip);
    qs("section form").addEventListener("submit", postNewYip);
  }

  /**
   * this method makes a post to the /yipper/new url so that a new yip post can be made using the
   * data recieved from the server
   * @param {Event} event prevents the form from submitting
   * throws error if user doesnt exist, or if params are incomplete
   */
  function postNewYip(event) {
    event.preventDefault();
    let params = new FormData();
    params.append("name", id("name").value);
    params.append("full", id("yip").value);
    fetch("/yipper/new", {method: 'POST', body: params})
      .then(checkStatus)
      .then(response => response.json())
      .then(generateNewYip)
      .catch(openError);
  }

  /**
   * this method will create the new yip that was posted and will insert it most recent. After
   * submiting it will also reset to the main page
   * @param {JSON} response JSON from server to be used to create the new yip
   */
  function generateNewYip(response) {
    id("new").classList.add("hidden");
    let home = id("home");
    home.classList.remove("hidden");
    home.insertBefore(generateYip(response), home.childNodes[0]);
    id("name").value = "";
    id("yip").value = "";
  }

  /**
   * properly sets the display to the new yip page
   */
  function makeNewYip() {
    id("new").classList.remove("hidden");
    if (!(id("home").classList === "hidden")) {
      id("home").classList.add("hidden");
    }
    if (!(id("user").classList === "hidden")) {
      id("user").classList.add("hidden");
    }
  }

  /**
   * this method resets the pages to appear as normal, used when home button is clicked so it
   * returns to home
   */
  function resetPages() {
    id("home").classList.remove("hidden");
    id("search-term").value = "";
    if (!(id("user").classList === "hidden")) {
      id("user").classList.add("hidden");
    }
    if (!(id("new").classList === "hidden")) {
      id("new").classList.add("hidden");
    }
    resetHidden();
  }

  /**
   * when the search button is clicked, takes the value that is searched for and calls to the
   * server and returns a JSON of any yips like the one searched for
   */
  function searchFor() {
    resetHidden();
    resetUserDisplay();
    if (id("home").classList.contains("hidden")) {
      id("home").classList.remove("hidden");
    }
    if (!(id("new").classList === ("hidden"))) {
      id("new").classList.add("hidden");
    }
    let search = id("search-term").value;
    fetch("/yipper/yips?search=" + search)
      .then(checkStatus)
      .then(response => response.json())
      .then(displaySearch)
      .catch(openError);
  }

  /**
   * takes a json of yips to display and will hide all the ones that dont match
   * @param {JSON} response data for yips in JSON format
   */
  function displaySearch(response) {
    let allYips = id("home").children;
    for (let i = 0; i < allYips.length; i++) {
      allYips[i].classList.add("hidden");
      allYips[i].classList.remove("card");
    }
    for (let i = 0; i < response.yips.length; i++) {
      id(response.yips[i].id).classList.remove("hidden");
      id(response.yips[i].id).classList.add("card");
    }
  }

  /**
   * will hide the user display if it is not hidden already
   */
  function resetUserDisplay() {
    if (!(id("user").classList === "hidden")) {
      id("user").classList.add("hidden");
    }
  }

  /**
   * helper method which will reset all yips in the home page to visible and add the card classlist
   */
  function resetHidden() {
    let allYips = id("home").children;
    for (let i = 0; i < allYips.length; i++) {
      if (allYips[i].classList.contains("hidden")) {
        allYips[i].classList.remove("hidden");
        allYips[i].classList.add("card");
      }
    }
  }

  /**
   * this method checks whether or not it is only white space or characters in the search bar
   * and will disable or enable the button
   */
  function buttonAction() {
    if (id("search-term").value.trim(' ') !== "") {
      id("search-btn").disabled = false;
    } else {
      id("search-btn").disabled = true;
    }
  }

  /**
   * this function will prepare the Yips by calling to the server which will return a JSON object
   * of all the data required to implemenet the yips to the page
   */
  function prepareYips() {
    fetch("/yipper/yips")
      .then(checkStatus)
      .then(response => response.json())
      .then(preparePage)
      .catch(openError);
  }

  /**
   * checks the status of the response from the server and throws an error if there is an issue
   * @param {JSON/Text} response JSON passed
   * @returns {JSON/Text} the response passed as parameter
   */
  function checkStatus(response) {
    if (!response.ok) {
      throw Error("Error in request: " + response.statusText);
    } else {
      return response;
    }
  }

  /**
   * opens the error page
   */
  function openError() {
    id("yipper-data").classList.add("hidden");
    id("error").classList.remove("hidden");
    id("search-btn").disabled = true;
    id("home-btn").disabled = true;
    id("yip-btn").disabled = true;
  }

  /**
   * prepare the page by using the data in JSON to create yip objects and append it the the page
   * @param {JSON} response JSON data passed
   */
  function preparePage(response) {
    for (let i = 0; i < response.yips.length; i++) {
      id("home").appendChild(generateYip(response.yips[i]));
    }
  }

  /**
   * method which takes JSON data and using the data given will create a proper yip object
   * @param {JSON} yipJson data passed used to create yip
   * @returns {Element} created yip object
   */
  function generateYip(yipJson) {
    let yip = gen("article");
    yip.classList.add("card");
    yip.id = yipJson.id;
    let img = generateIMG(yipJson.name.split(' '), yipJson);
    let firstDiv = generateFirstDiv(yipJson);
    let secondDiv = gen("div");
    secondDiv.classList.add("meta");
    let pTag = gen("p");
    pTag.innerText = (new Date(yipJson.date)).toLocaleString();
    let div2 = gen("div");
    let div2Img = gen("img");
    div2Img.addEventListener("click", incrementHeartCount);
    div2Img.src = "img/heart.png";
    div2Img.alt = "heart";
    let heartCount = gen("p");
    heartCount.innerText = yipJson.likes;
    div2.appendChild(div2Img);
    div2.appendChild(heartCount);
    secondDiv.appendChild(pTag);
    secondDiv.appendChild(div2);
    yip.appendChild(img);
    yip.appendChild(firstDiv);
    yip.appendChild(secondDiv);
    return yip;
  }

  /**
   * helper method for generateYip, generates the firstDiv for the yip
   * @param {JSON} yipJson has data to put in the firstDiv
   * @returns {div} firstDiv
   */
  function generateFirstDiv(yipJson) {
    let firstDiv = gen("div");
    let p1 = gen("p");
    p1.addEventListener("click", displayUserInfo);
    p1.innerText = yipJson.name;
    p1.classList.add("individual");
    p1.addEventListener("click", displayUserInfo);
    let p2 = gen("p");
    p2.innerText = yipJson.yip + " #" + yipJson.hashtag;
    firstDiv.appendChild(p1);
    firstDiv.appendChild(p2);
    return firstDiv;
  }

  /**
   * this is a helper method for generate yip which creates and returns the img which would be
   * added to the yip
   * @param {array} names array of each word in the total name
   * @param {JSON} yipJson JSON data to produce the img
   * @returns {img} returns the image made
   */
  function generateIMG(names, yipJson) {
    let img = gen("img");
    if (names.length > 1) {
      img.src = "img/";
      for (let i = 0; i < names.length - 1; i++) {
        img.src += names[i].toLowerCase() + '-';
      }
      img.src += names[names.length - 1].toLowerCase() + ".png";
    } else {
      img.src = "img/" + names[0].toLowerCase() + ".png";
    }
    img.alt = yipJson.name;
    return img;
  }

  /**
   * this method makes a post call to the likes endpoint which returns text from the server
   * of the amount of likes incremented by 1
   */
  function incrementHeartCount() {
    let element = this;
    let likeId = element.parentNode.parentNode.parentNode.id;
    let params = new FormData();
    params.append("id", likeId);
    fetch("/yipper/likes", {method: "POST", body: params})
      .then(checkStatus)
      .then(response => response.text())
      .then(response => {testLikes(response, element);})
      .catch(openError);
  }

  /**
   * changes the display in the DOM of how many likes the certain yip has
   * @param {text} response amount of likes returned from the server
   * @param {object}element element which like count needs to be changed
   */
  function testLikes(response, element) {
    element.nextSibling.innerText = response;
  }

  /**
   * fetches json of all the passed user's yips and displays it to the page
   */
  function displayUserInfo() {
    emptyUser();
    fetch("/yipper/user/" + this.textContent)
      .then(checkStatus)
      .then(response => response.json())
      .then(displayUser)
      .catch(openError);
  }

  /**
   * this method gets rid of any extra users in the user display page
   */
  function emptyUser() {
    if (id("user").hasChildNodes()) {
      id("user").removeChild(id("user").childNodes[0]);
    }
  }

  /**
   * creates and displays the user using the JSON data from the server
   * @param {JSON} response JSON data from the server regarding the user
   */
  function displayUser(response) {
    id("search-term").value = "";
    id("user").classList.remove("hidden");
    if (!id("home").classList.contains("hidden")) {
      id("home").classList.add("hidden");
    }
    let display = gen("article");
    display.classList.add("single");
    let owner = gen("h2");
    owner.textContent = "Yips shared by " + response[0].name;
    display.appendChild(owner);
    for (let i = 0; i < response.length; i++) {
      let addedP = gen("p");
      let data = createYipPreview(response[i]);
      addedP.innerText = "Yip " + (i + 1) + ": " + data;
      display.append(addedP);
    }
    id("user").append(display);
  }

  /**
   * helper method for displayUser which makes the correct yip
   * @param {JSON} data data to create the yip
   * @returns {String} yip data
   */
  function createYipPreview(data) {
    let yip = data.yip;
    let hashtag = data.hashtag;
    return yip + " #" + hashtag;
  }

  /**
   * returns the access to the element by name of the id passed as a parameter
   * @param {String} idName name of the id
   * @returns {element} returns the access to the element
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * returns the access to the element by DOM path, or element type
   * @param {String} selector path to element or element name
   * @returns {element} returns the access to the element
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * returns generated element by type passed by parameter
   * @param {String} elType type of element to be generated
   * @returns {Element} generated element
   */
  function gen(elType) {
    return document.createElement(elType);
  }
})();
