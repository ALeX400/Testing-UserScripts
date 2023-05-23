// ==UserScript==
// @name         Submit File Script to ChatGPT
// @namespace    https://www.tampermonkey.net
// @version      1.0
// @description  Submit a file in chunks
// @author       ChatGPT
// @match        https://chat.openai.com/*
// @icon         https://chat.openai.com/favicon-32x32.png
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function to submit a conversation chunk
    async function submitConversation(text, part, filename) {
        const textarea = document.querySelector("textarea[tabindex='0']");
        const enterKeyEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            keyCode: 13,
        });
        textarea.value = `Part ${part} of ${filename}:\n\n${text}`;
        textarea.dispatchEvent(enterKeyEvent);
    }

    // Function to handle file selection
    function handleFileSelect(evt) {
        const file = evt.target.files[0];
        const reader = new FileReader();
        const chunkSize = 15000;
        const progressBar = document.getElementById('progress-bar');
        const progressBarFill = document.getElementById('progress-bar-fill');
        let numChunks = 0;
        let currentChunk = 0;

        progressBar.style.width = '0%';

        reader.onload = async function (e) {
            const contents = e.target.result;
            const chunks = [];

            // Split the file into chunks
            for (let i = 0; i < contents.length; i += chunkSize) {
                chunks.push(contents.slice(i, i + chunkSize));
            }

            numChunks = chunks.length;

            // Process and submit each chunk
            for (let i = 0; i < chunks.length; i++) {
                await submitConversation(chunks[i], i + 1, file.name);
                currentChunk = i + 1;
                progressBar.style.width = `${((i + 1) / numChunks) * 100}%`;
            }

            // Wait for ChatGPT to be ready
            let chatgptReady = false;
            while (!chatgptReady) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                chatgptReady = !document.querySelector(".text-2xl > span:not(.invisible)");
            }

            // All chunks submitted, update progress bar to blue
            progressBar.style.backgroundColor = 'blue';
            progressBarFill.style.backgroundColor = 'blue';
        };

        reader.readAsText(file);
    }

    // Function to check if page is fully loaded
    function isPageLoaded() {
        return document.readyState === 'complete';
    }

    // Function to wait for page to be fully loaded
    async function waitForPageLoaded() {
        while (!isPageLoaded()) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    // Function to create the button and progress elements
    function createButtonAndProgressElements() {
        // Create the button
        const button = document.createElement('button');
        button.innerText = 'Submit File';
        button.style.backgroundColor = 'green';
        button.style.color = 'white';
        button.style.padding = '5px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.margin = '5px';

        // Create the progress element
        const progressElement = document.createElement('div');
        progressElement.style.width = '99%';
        progressElement.style.height = '5px';
        progressElement.style.backgroundColor = 'grey';

        // Create the progress bar
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.style.width = '0%';
        progressBar.style.height = '100%';
        progressBar.style.backgroundColor = 'blue';

        // Append the progress bar to the progress element
        progressElement.appendChild(progressBar);

        // Find the target element to insert before
        const targetElement = document.querySelector('.flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4');

        // Insert the button and progress element before the target element
        targetElement.parentNode.insertBefore(progressElement, targetElement);
        targetElement.parentNode.insertBefore(button, targetElement);

        // Add event listener for file selection
        button.addEventListener('click', function () {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.txt, .js, .py, .html, .css, .json, .csv';
            fileInput.addEventListener('change', handleFileSelect);
            fileInput.click();
        });
    }

    // Wait for the page to be fully loaded
    waitForPageLoaded().then(createButtonAndProgressElements);
})();
