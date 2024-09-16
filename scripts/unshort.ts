{
    // redirect shorts to normal player
    if (window.location.pathname.startsWith("/shorts/")) {
        document.body.innerHTML = "";
        setTimeout(() => {
            window.location.replace(`https://www.youtube.com/watch?v=${window.location.pathname.split("/")[2]}`);
        });
    } else if (window.location.pathname.endsWith("/shorts")) {
        document.body.innerHTML = "";
        setTimeout(() => {
            window.location.replace(window.location.href.slice(0, window.location.href.length - "/shorts".length));
        });
    }

    function classElArr(selector: string): Array<Element> {
        return Array.from(document.getElementsByClassName(selector));
    }

    function removeChilds(oldArr: Element[]): Element[] {
        let newArr: Element[] = [];
        oldArr.forEach(el => {
            const parent = el.parentNode;
            if (!parent || !oldArr.includes(parent as Element)) {
                newArr.push(el);
            }
        });
        return newArr;
    }

    let intervalTime = 16;

    function main() {
        let hidShort = false;

        if (window.location.pathname.includes("/@")) {
            // remove shorts on channel page
            classElArr("yt-tab-shape-wiz yt-tab-shape-wiz--host-clickable").forEach(el => {
                if (el.textContent?.includes("Shorts")) {
                    el.remove();
                    hidShort = true;
                }
            })
        } else if (window.location.pathname === "/watch") {
            // remove shorts on videos
            classElArr("style-scope ytd-item-section-renderer")
                .filter(a => a.tagName === 'YTD-REEL-SHELF-RENDERER')
                .forEach(el => {
                    const child = el.children[0];
                    if (child && child.textContent?.includes("Shorts")) {
                        el.remove();
                        hidShort = true;
                    }
                })
        } else {
            // remove shorts containers on homepage
            let shortContainers = classElArr('style-scope ytd-rich-shelf-renderer')
                .filter(el => {
                    const shorts = el.getElementsByClassName('ShortsLockupViewModelHost');
                    return (el as HTMLElement).offsetParent !== null && el.tagName !== 'YTD-RICH-ITEM-RENDERER' && shorts.length > 0;
                });
            removeChilds(shortContainers).forEach(container => {
                container.remove();
                hidShort = true;
            });
        }
            
        // remove small shorts button
        classElArr("style-scope ytd-mini-guide-renderer")
            .forEach(btn => {
                if (btn.tagName === 'YTD-MINI-GUIDE-ENTRY-RENDERER' && btn.textContent?.includes("Shorts")) {
                    btn.remove();
                    hidShort = true;
                }
            });

        // remove big shorts button
        classElArr("style-scope ytd-guide-section-renderer")
            .forEach(btn => {
                if (btn.tagName === 'YTD-GUIDE-ENTRY-RENDERER' && btn.textContent?.includes("Shorts")) {
                    btn.remove();
                    hidShort = true;
                }
            });

        if (hidShort) {
            intervalTime = 4;
        } else if (intervalTime < 1024) {
            // if no shorts were found recently increase
            // interval time in order to save CPU cycles
            intervalTime *= 2;
        }

        setTimeout(main, intervalTime);
    }

    // if the user scrolls then more shorts may pop up
    window.addEventListener("scroll", () => {
        intervalTime = 16;
    });

    // if the user resizes the window new shorts buttons may be rendered
    window.addEventListener("resize", () => {
        intervalTime = 16;
    });

    // wait roughly half a second for the page to load
    setTimeout(main, 500);

    // time record stuff
    function getDateStr(): string {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    function getHrs(ms: number): string {
        return (ms / 60 / 60).toFixed(2);
    }

    let lastRecord = Date.now();

    setInterval(async () => {
        if (document.hasFocus()) {
            // calc the time changes
            const now = Date.now();
            const nowDateStr = getDateStr();
            const deltaTime = (now - lastRecord) / 1000;
            lastRecord = now;

            // get old data
            const store = await chrome.storage.local.get([ "totalTime", "today", "todayTime" ]);
            if (store.totalTime === undefined) {
                store.totalTime = 0;
            }
            if (store.todayTime === undefined) {
                store.todayTime = 0;
            }
            if (store.today !== nowDateStr) {
                chrome.storage.local.set({ "today": nowDateStr });
                store.todayTime = 0;
            }

            // update data
            const netTotalTime = Math.round(store.totalTime + deltaTime);
            const netTodayTime = Math.round(store.todayTime + deltaTime);
            chrome.storage.local.set({ "totalTime": netTotalTime });
            chrome.storage.local.set({ "todayTime": netTodayTime });

            // display data
            // const logo = removeChilds(classElArr("style-scope ytd-topbar-logo-renderer"))[0] as HTMLElement;
            const logo = document.getElementById("logo");
            if (logo) {
                logo.style.fontSize = "1.8em";
                logo.style.color = "red";
                logo.style.paddingLeft = "10px";
                logo.innerHTML = `All: ${getHrs(netTotalTime)} hrs<br>Today: ${getHrs(netTodayTime)} hrs`;
            }
        }  else {
            lastRecord = Date.now();
        }
    }, 1000 * 5);
}