// ==UserScript==
// @name         NAI Prompt Linker
// @namespace    https://github.com/cpuopt/NAI-Prompt-Linker
// @version      1.0.8
// @description  Import prompts into NovelAI from other editor
// @author       cpufan
// @license      GPL-3.0 License
// @include      *://*:7860/*
// @include      *://*:17860/*
// @match        https://novelai.net/image
// @match        https://tags.novelai.dev/
// @match        https://thereisnospon.github.io/NovelAiTag/
// @match        https://wolfchen.top/tag/
// @match        https://tools.miku.ac/novelai_tag/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=novelai.net
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @run-at       document-end
// @updateURL    https://github.com/cpuopt/NAI-Prompt-Linker/raw/main/NAI-Prompt-Linker.user.js
// @downloadURL  https://github.com/cpuopt/NAI-Prompt-Linker/raw/main/NAI-Prompt-Linker.user.js
// @supportURL   https://github.com/cpuopt/NAI-Prompt-Linker/issues
// ==/UserScript==

(function () {
    "use strict";

    if (window.location.href.startsWith("https://novelai.net/image")) {
        console.debug("NAI端加载成功");
        var opInterval = 200;
        var insertText = (area, text) => {
            area.focus();
            document.execCommand("selectAll");
            document.execCommand("delete");
            document.execCommand("insertText", false, text);
            area.blur();
        };

        var click_generate = () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    document.evaluate("//span[contains(text(),'Generate ') and contains(text(),' Image')]/..", document.body, null, 9, null).singleNodeValue.click();
                    resolve();
                }, opInterval);
            });
        };

        var insertPrompt = (prompt) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    setTimeout(() => {
                        insertText(document.querySelector("textarea[placeholder='Write your prompt here. Use tags to sculpt your outputs.']"), prompt);
                    }, opInterval);
                    resolve();
                }, opInterval);
            });
        };

        var insertUndesiredContent = (uprompt) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    setTimeout(() => {
                        insertText(document.querySelector("textarea[placeholder='Write what you want removed from the generation.']"), uprompt);
                    }, opInterval);
                    resolve();
                }, opInterval);
            });
        };

        async function insert(prompt, uprompt, generate) {
            if (uprompt != null) await insertUndesiredContent(uprompt);
            if (prompt != null) await insertPrompt(prompt);
            if (generate == true) {
                await click_generate();
            }
        }

        let NAI_save = GM_addValueChangeListener("->NAI", function (key, oldValue, newValue, remote) {
            console.debug(key + ":\n" + oldValue + "=>" + newValue);
            if (newValue != null) {
                let title = document.title;
                document.title = "NAI Accepted!";
                console.debug(newValue.msg, newValue.time, newValue.prompt.prompt, newValue.prompt.uprompt);
                insert(newValue.prompt.prompt, newValue.prompt.uprompt, newValue.generate);

                GM_setValue("NAI->", { time: newValue.time });
                setTimeout(() => {
                    document.title = title;
                }, 2000);
            }
        });
    } else {
        var pluginCanvas;
        var sendPrompt;
        window.onload = function () {
            //菜单初始化
            pluginCanvas = new Canvas();
            sendPrompt = new SendPrompt();
        };

        class SendPrompt {
            button;
            last_time;
            constructor() {
                this.button = document.createElement("button");
                this.button.className = "plugin-button-blue";
                this.button.id = "SendPromptButton";
                this.button.innerText = "发送Prompt到NAI";

                // this.button.innerHTML = `
                // <svg xmlns="http://www.w3.org/2000/svg" style="fill:white" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="20" height="20"><path d="m20,0H4C1.794,0,0,1.794,0,4v12c0,2.206,1.794,4,4,4h2.923l3.748,3.156c.382.34.862.509,1.338.509.467,0,.931-.163,1.292-.485l3.847-3.18h2.852c2.206,0,4-1.794,4-4V4c0-2.206-1.794-4-4-4Zm-3,13c0,.553-.448,1-1,1s-1-.447-1-1v-3.56l-5.294,5.269c-.195.194-.451.291-.706.291-.257,0-.513-.099-.709-.295-.39-.392-.388-1.024.003-1.414l5.317-5.291h-3.611c-.552,0-1-.447-1-1s.448-1,1-1h4c1.654,0,3,1.346,3,3v4Z"/></svg>
                // `
                this.button.setAttribute("onclick", `window.sendPrompt2NAI()`);

                const canvas = document.querySelector("#plugin-canvas");
                canvas.appendChild(this.button);

                let NAI_send = GM_addValueChangeListener("NAI->", function (key, oldValue, newValue, remote) {
                    console.debug(newValue);
                    if (newValue.time == sendPrompt.last_time) {
                        sendPrompt.button.className = "plugin-button-white";
                        sendPrompt.button.innerText = "发送成功";

                        setTimeout(() => {
                            sendPrompt.button.className = "plugin-button-blue";
                            sendPrompt.button.innerText = "发送Prompt到NAI";
                        }, 2000);
                    }
                });
            }
            /**
             * sd webui and prompt all in one app
             */
            send_Sd2promptAllinOne() {
                let prompt = document.querySelector("#txt2img_prompt > label > textarea").value;
                let uprompt = document.querySelector("#txt2img_neg_prompt > label > textarea").value;
                this.last_time = Number(Date.now());
                let msg = { msg: "", prompt: { prompt: prompt, uprompt: uprompt }, generate: false, time: this.last_time };
                console.debug("setValue", msg);
                GM_setValue("->NAI", msg);
            }

            /**
             * https://tags.novelai.dev/
             */
            send_DanbooruTagShop() {
                document.querySelector("#app > section > section > aside.el-aside.container-full-height.left-bordered.cart-aside > div.cart-container > div.btn-block.mb-bottom > button").click();

                setTimeout(() => {
                    let prompt = document.querySelector("div.tag-positive > div.el-textarea > textarea").value;
                    let uprompt = document.querySelector("div.tag-negative > div.el-textarea > textarea").value;
                    this.last_time = Number(Date.now());
                    let msg = { msg: "", prompt: { prompt: prompt, uprompt: uprompt }, generate: false, time: this.last_time };
                    console.debug("setValue", msg);
                    GM_setValue("->NAI", msg);
                    document.querySelector("div.cart-container > div> div > div > footer > span > button").click();
                }, opInterval);
            }
            /**
             * https://thereisnospon.github.io/NovelAiTag/
             */
            send_Novel_AI_Tag() {
                let prompt = document.getElementById("textarea_pos").value;
                let uprompt = document.getElementById("textarea_neg").value;
                this.last_time = Number(Date.now());
                let msg = { msg: "", prompt: { prompt: prompt, uprompt: uprompt }, generate: false, time: this.last_time };
                console.debug("setValue", msg);
                GM_setValue("->NAI", msg);
            }
            /**
             * https://wolfchen.top/tag/
             */
            send_NovelAITagGenerator() {
                let prompt = document.getElementById("tagarea").value + document.getElementById("tagareb").value;
                let uprompt = document.getElementById("tagarea2").value;
                this.last_time = Number(Date.now());
                let msg = { msg: "", prompt: { prompt: prompt, uprompt: uprompt }, generate: false, time: this.last_time };
                console.debug("setValue", msg);
                GM_setValue("->NAI", msg);
            }

            /**
             * https://tools.miku.ac/novelai_tag/
             */
            send_MikuToolsNaiTag() {
                let prompt = document.querySelector("div.nya-copy > pre > span").textContent;
                this.last_time = Number(Date.now());
                let msg = { msg: "", prompt: { prompt: prompt, uprompt: null }, generate: false, time: this.last_time };
                console.debug("setValue", msg);
                GM_setValue("->NAI", msg);
            }
        }

        /**
         * 插件菜单类
         */
        class Canvas {
            constructor() {
                var styles = document.createElement("style");
                document.head.appendChild(styles);
                styles.innerHTML = `
#plugin-canvas {z-index:99999;min-width: max-content;position: fixed;background-color: #ffffff;height: 75px;border-radius: 10px;border-inline: solid 2px rgb(162, 218, 255)}
.plugin-button-blue {display: block;color: rgb(255, 255, 255);background-color: rgb(0, 150, 250);font-size: 14px;font-weight: bold;margin: 16px;padding-left: 20px;padding-right: 20px;height: 42px;border: none;border-radius: 100000px;transition: background-color 0.6s;}
.plugin-button-white {display: block;color: rgb(71,71,71);background-color: rgb(245,245,245);font-size: 14px;font-weight: bold;margin: 16px;padding-left: 20px;padding-right: 20px;height: 42px;border: none;border-radius: 100000px;transition: background-color 0.6s;}
.plugin-button-blue:hover {background-color: rgb(0,114,240);cursor: pointer;}
.plugin-button-white:hover {background-color: rgb(235,235,235);cursor: pointer;}
.hideCanvas {padding: 0;height: 60px;width: 15px;position: absolute;left: -15px;top: 6px;border: solid 2px rgb(162, 218, 255);background-color: rgb(255, 255, 255);border-radius: 10px 0px 0px 10px;transition: background-color 0.6s;cursor: pointer;}
.hideCanvas:hover{background-color: rgb(162, 218, 255);}
.showCanvas {padding: 0;height: 60px;width: 15px;position: absolute;left: -15px;top: 6px;border: solid 2px rgb(162, 218, 255);background-color: rgb(255, 255, 255);border-radius: 10px 0px 0px 10px;transition: background-color 0.6s;cursor: pointer;}
.showCanvas:hover{background-color: rgb(162, 218, 255);}
        `;
                let canvas = document.createElement("div");
                canvas.id = "plugin-canvas";
                canvas.style.right = "0";
                canvas.style.top = "5px";

                let canvasButton = document.createElement("button");
                var offsetX, offsetY;
                var isDragging = false;

                canvasButton.addEventListener("mousedown", function (e) {
                    offsetX = e.clientX - canvas.offsetLeft;
                    offsetY = e.clientY - canvas.offsetTop;
                    isDragging = true;
                });

                document.addEventListener("mousemove", function (e) {
                    if (isDragging) {
                        canvas.style.right = "auto";
                        canvas.style.left = e.clientX - offsetX + "px";
                        canvas.style.top = e.clientY - offsetY + "px";
                    }
                });

                document.addEventListener("mouseup", function (e) {
                    isDragging = false;
                });

                canvas.appendChild(canvasButton);
                canvasButton.id = "canvasButton";
                // canvasButton.setAttribute('onclick', `window.hideCanvas()`)
                canvasButton.className = "hideCanvas";
                canvasButton.innerHTML = '<svg style="margin-left:-2px" width="16" height="16" fill="rgb(0,150,250)" class="bi bi-caret-right-fill" viewBox="0 0 16 16"><path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/></svg>';

                document.body.appendChild(canvas);
            }
            /**
             * 显示插件菜单
             */
            show() {
                document.querySelector("#plugin-canvas").style.right = "0px";

                document.querySelector("#canvasButton").className = "hideCanvas";
                document.querySelector("#canvasButton").innerHTML = `<svg style="margin-left:-2px" width="16" height="16" fill="rgb(0,150,250)" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
        <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
      </svg>`;
                document.querySelector("#canvasButton").setAttribute("onclick", `window.hideCanvas()`);
            }
            /**
             * 隐藏插件菜单
             */
            hide() {
                document.querySelector("#plugin-canvas").style.right = "-171.6px";

                document.querySelector("#canvasButton").className = "showCanvas";
                document.querySelector("#canvasButton").innerHTML = `<svg style="margin-left:-2px" width="16" height="16" fill="rgb(0,150,250)" class="bi bi-caret-left-fill" viewBox="0 0 16 16">
            <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
          </svg>`;
                document.querySelector("#canvasButton").setAttribute("onclick", `window.showCanvas()`);
            }
        }

        // 显示插件菜单
        unsafeWindow.showCanvas = function () {
            pluginCanvas.show();
            GM_setValue("CanvasState", "S");
        };
        // 隐藏插件菜单
        unsafeWindow.hideCanvas = function () {
            pluginCanvas.hide();
            GM_setValue("CanvasState", "H");
        };

        // 发送Prompt到NAI
        unsafeWindow.sendPrompt2NAI = function () {
            let url = window.location.href;
            console.log(url);
            if (/(http|https):\/\/(localhost|127\.0\.0\.1):(7860|17860)\\*/.test(url)) {
                sendPrompt.send_Sd2promptAllinOne();
            } else if (/https:\/\/tags.novelai.dev/.test(url)) {
                sendPrompt.send_DanbooruTagShop();
            } else if (/https:\/\/thereisnospon.github.io\/NovelAiTag/.test(url)) {
                sendPrompt.send_Novel_AI_Tag();
            } else if (/https:\/\/wolfchen.top\/tag/.test(url)) {
                sendPrompt.send_NovelAITagGenerator();
            } else if (/https:\/\/tools.miku.ac\/novelai_tag/.test(url)) {
                sendPrompt.send_MikuToolsNaiTag();
            }
        };
    }
})();
