/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./public/global-js-animations.js":
/*!****************************************!*\
  !*** ./public/global-js-animations.js ***!
  \****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n// Create a MutationObserver instance\r\nlet observer = new MutationObserver((mutations) => {\r\n    mutations.forEach((mutation) => {\r\n      if (mutation.attributeName === 'style') {\r\n        let displayStyle = mutation.target.style.display;\r\n        if (displayStyle === 'none') {\r\n          mutation.target.classList.add('fadeOut');\r\n          // After animation ends remove the element\r\n          mutation.target.addEventListener('animationend', () =>  {\r\n            mutation.target.style.display = 'none';\r\n          }, {once: true});\r\n        } else if (displayStyle === 'block') {\r\n          mutation.target.classList.remove('fadeOut');\r\n        }\r\n      }\r\n    });\r\n  });\r\n  \r\n  // Select all modals\r\n  let modals = document.querySelectorAll('.modal-generic');\r\n  \r\n  // Start observing each modal\r\n  modals.forEach((modal) => {\r\n    observer.observe(modal, { attributes: true });\r\n  });\r\n  \n\n//# sourceURL=webpack://gpt/./public/global-js-animations.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./public/global-js-animations.js"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ })()
;