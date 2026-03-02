window.HELP_IMPROVE_VIDEOJS = false;

// 1. Configuration
const sceneFiles = [
    "pulley",
    "collision",
    "orbital",
    "rocket",
    "projectile",
    "spring"
];

const qaTypes = ["numeric", "reverse", "symbolic"];
let sceneIndex = 0;
let qaIndex = 0;

// Arrow navigation helpers
function navigateScene(delta) {
    sceneIndex = (sceneIndex + delta + sceneFiles.length) % sceneFiles.length;
    const sceneName = sceneFiles[sceneIndex];
    const labelEl = document.getElementById('scene-label');
    if (labelEl) labelEl.textContent = sceneName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    syncSelectors(sceneName);
}

function navigateQA(delta) {
    qaIndex = (qaIndex + delta + qaTypes.length) % qaTypes.length;
    const qaType = qaTypes[qaIndex];
    const labelEl = document.getElementById('qa-label');
    if (labelEl) labelEl.textContent = qaType.charAt(0).toUpperCase() + qaType.slice(1);
    updateQAOnly();
}
const exampleResponses = [
    "sun_earth_escape",
    "rotation",
    "projectile",
    "shm",
];

const PLOT_MANIFEST = {
    collision: [
        "ComplexCollisionPlane.mass-0.png",
        "ComplexCollisionPlane.sphere-1.png",
        "ComplexCollisionPlane.spring_mass-3.mass-0.png",
        "ComplexCollisionPlane.spring_mass-3.mass-1.png",
    ],

    orbital: [
        "solarsystementity_0.planet-0.png",
        "solarsystementity_0.planet-1.png",
        "solarsystementity_0.planet-2.png",
    ],

    projectile: [
        "throwing_motion_system.ball.png",
    ],

    pulley: [
        "fixed_pulley_start.mass.png",
        "mass_prism_plane.mass.png",
        "mass_prism_plane.prism.png",
    ],

    rocket: [
        "idk.rocket.collision_geom.png",
    ],

    rolling: [
        "rollingplaneentity_0.mesh_body.png",
    ],

    rotation: [
        "MyRigidRotationEntity.bar-0.png",
    ],

    spring: [
        "springblockentity_0.tray_mass.png",
    ],
};

// 2. Initialize (Runs once)
function initSelectors() {
    // Initialize scene arrow nav label
    const sceneLabelEl = document.getElementById('scene-label');
    if (sceneLabelEl && sceneFiles.length > 0) {
        sceneLabelEl.textContent = sceneFiles[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Initialize QA arrow nav label
    const qaLabelEl = document.getElementById('qa-label');
    if (qaLabelEl && qaTypes.length > 0) {
        qaLabelEl.textContent = qaTypes[0].charAt(0).toUpperCase() + qaTypes[0].slice(1);
    }

    // Initialize example-selector dropdown (kept as-is)
    const exSel = document.getElementById('example-selector');
    if (exSel) {
        exSel.innerHTML = '';
        exampleResponses.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.text = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            exSel.appendChild(option);
        });
    }

    // Load first scene automatically
    if (sceneFiles.length > 0) {
        syncSelectors(sceneFiles[0]);
    }
}

// 3. Sync & Load
function syncSelectors(selectedScene) {
    // Update Content
    updateContent(selectedScene);
}

// 4. Update Content Logic
function updateContent(sceneName) {
    // File Paths
    const dslPath = `./static/dsl/${sceneName}.yaml`;
    const videoPath = `./static/videos/${sceneName}.mp4`;
    const qaPath = `./static/qa/${sceneName}.txt`; // Assuming .txt or .json
    const plotPath = `./static/plots/${sceneName}`;

    // --- Update Videos (Both 1 and 2) ---
    ['video-1', 'video-2'].forEach(videoId => {
        const videoEl = document.getElementById(videoId);
        if (videoEl) {
            // Only reload if source changed (prevents flickering)
            if (!videoEl.src.includes(sceneName + ".mp4")) {
                videoEl.src = videoPath;
                videoEl.load();
            }
        }
    });

    // --- Update Plots ---
    const plotEl = document.getElementById('plot-container');
    if (plotEl) {
        // Only reload if source changed (prevents flickering)
        // plotPath is a folder, containing k images, show all of them in a nice way
        loadPlots(sceneName);
    }

    // --- Update DSL Text ---
    fetchText(dslPath, 'content-dsl', 'yaml');

    // 3. Update QA
    updateQAOnly();
}

function updateScene() {
    const sceneName = sceneFiles[sceneIndex];
    syncSelectors(sceneName);
}

// --- Helper to apply the specific k-grid logic ---
function applyPlotGrid(container, k) {
    const n = Math.ceil(Math.sqrt(k)); // Your layout logic
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    container.style.gap = '1rem';
}

// --- Plot Loader ---
function loadPlots(sceneName) {
    const plotEl = document.getElementById('plot-container');
    if (!plotEl) return;

    if (plotEl.dataset.scene === sceneName) return;
    plotEl.dataset.scene = sceneName;
    plotEl.innerHTML = '';

    const files = PLOT_MANIFEST[sceneName];
    if (!files || files.length === 0) {
        plotEl.innerHTML = '<em>No plots available.</em>';
        return;
    }

    // Apply the grid layout to the main container
    applyPlotGrid(plotEl, files.length);

    files.forEach(fname => {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';

        const img = document.createElement('img');
        img.src = `./static/plots/${sceneName}/${fname}`;
        img.style.width = '100%';
        img.style.borderRadius = '6px';
        img.classList.add('plot-img');

        const label = document.createElement('div');
        label.textContent = fname.replace(/\.png$/, '');
        label.style.fontSize = '0.7rem';
        label.style.marginTop = '0.2rem';
        label.style.fontFamily = 'monospace';

        wrapper.appendChild(img);
        wrapper.appendChild(label);
        plotEl.appendChild(wrapper);
    });
}

// --- Modal Controls ---
function openPlotModal() {
    const modal = document.getElementById('plot-modal');
    const modalContent = document.getElementById('modal-plot-container');
    const files = PLOT_MANIFEST[document.getElementById('plot-container').dataset.scene];

    if (!files) return;

    // 1. Clear and Rebuild (don't just clone) to add fresh event listeners
    modalContent.innerHTML = '';

    // 2. Apply the same grid logic
    const k = files.length;
    applyPlotGrid(modalContent, k);
    modalContent.style.gap = '1.5rem';

    // 3. Create elements with click-to-expand logic
    files.forEach(fname => {
        const wrapper = document.createElement('div');
        wrapper.className = 'plot-wrapper';

        // Toggle the 'is-expanded' class on click
        wrapper.onclick = function () {
            // Optional: Close other expanded ones first (Accordion style)
            // modalContent.querySelectorAll('.is-expanded').forEach(el => {
            //    if(el !== wrapper) el.classList.remove('is-expanded');
            // });

            this.classList.toggle('is-expanded');

            // Smoothly scroll the expanded image into view
            if (this.classList.contains('is-expanded')) {
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
        };

        const img = document.createElement('img');
        img.src = `./static/plots/${document.getElementById('plot-container').dataset.scene}/${fname}`;
        img.style.width = '100%';
        img.style.borderRadius = '6px';
        img.style.display = 'block';

        const label = document.createElement('div');
        label.className = 'plot-label';
        label.textContent = fname.replace(/\.png$/, '');
        label.style.fontSize = '0.9rem';
        label.style.marginTop = '0.5rem';
        label.style.fontFamily = 'monospace';
        label.style.textAlign = 'center';

        wrapper.appendChild(img);
        wrapper.appendChild(label);
        modalContent.appendChild(wrapper);
    });

    modal.classList.add('is-active');
    document.documentElement.classList.add('is-clipped');
}

function closePlotModal() {
    document.getElementById('plot-modal').classList.remove('is-active');
    document.documentElement.classList.remove('is-clipped');
}

// --- Triggered when QA Type or Scene changes ---
function updateQAOnly() {
    const sceneName = sceneFiles[sceneIndex];
    const qaType = qaTypes[qaIndex];
    const container = document.getElementById('content-qa');

    // Construct path: qa/numeric/pulley.txt
    const qaPath = `./static/qa/${qaType}/${sceneName}.txt`;

    container.innerHTML = '<span style="color:#888">Loading QA...</span>';

    fetch(qaPath)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
            return res.text();
        })
        .then(text => {
            // Parse and display rich HTML
            container.innerHTML = parseQAText(text);
        })
        .catch(err => {
            // Provide a clearer, actionable message when the page is opened via file://
            let hint = '';
            try {
                if (window && window.location && window.location.protocol === 'file:') {
                    hint = '<br><small>Hint: You are opening the page from the filesystem (file://). Fetch requests to local files are blocked by browsers. Run a local HTTP server from the project root (for example: <code>python3 -m http.server 8000</code>) and open <code>http://localhost:8000</code> instead.</small>';
                }
            } catch (e) {
                // ignore
            }

            container.innerHTML = `<span style="color:red">Error loading ${qaType}/${sceneName}.txt</span><br><small>${err.message}</small>${hint}`;
            console.error('Failed to fetch QA file:', qaPath, err);
        });
}

// --- Helper: Generic Text Fetcher for DSL ---
function fetchText(url, elementId, languageClass) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // show loading state
    el.textContent = 'Loading...';
    el.className = `language-${languageClass}`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
            return res.text();
        })
        .then(text => {
            el.textContent = text;
            el.className = `language-${languageClass}`;
            el.removeAttribute('data-highlighted');
            if (window.hljs) hljs.highlightElement(el);
        })
        .catch(err => {
            // If page opened via file://, provide guidance
            let hint = '';
            try {
                if (window && window.location && window.location.protocol === 'file:') {
                    hint = '\n\nHint: You are opening the page from the filesystem (file://). Fetch requests to local files are blocked by browsers. Run a local HTTP server from the project root (for example: python3 -m http.server 8000) and open http://localhost:8000 instead.';
                }
            } catch (e) {
                // ignore
            }

            el.textContent = `Error loading ${url}: ${err.message}${hint}`;
            console.error('Failed to fetch text file:', url, err);
        });
}

const normalizeText = s =>
    s
        .replace(/\r\n/g, '\n')        // normalize line endings
        .split('\n')                   // work line-by-line
        .map(line => line.trim())      // remove leading/trailing spaces
        .filter(line => line.length)   // drop empty lines
        .join('\n');

// --- Helper: Parse Custom QA Format ---
function parseQAText(rawText) {
    // 1. Extract Tags (New Structure)
    const descMatch = rawText.match(/<description>([\s\S]*?)<\/description>/i);
    const questionMatch = rawText.match(/<question>([\s\S]*?)<\/question>/i);
    const answerMatch = rawText.match(/<answer>([\s\S]*?)<\/answer>/i);
    const mappingMatch = rawText.match(/<mapping>([\s\S]*?)<\/mapping>/i);

    // Use .trim() directly to avoid 'normalizeText is not defined' error
    let descriptionText = descMatch ? descMatch[1].trim() : "No description found.";
    let questionText = questionMatch ? questionMatch[1].trim() : "No question found.";
    let answerText = answerMatch ? answerMatch[1].trim() : "No answer found.";
    let mappingJson = mappingMatch ? mappingMatch[1].trim() : null;

    // 2. Prepare Variables for Linting
    // We use a Set to ensure 'x' is only added once
    let varsToHighlight = new Set(['x', 'X']);

    // Handle JSON parsing (New Version's robust Python-dict support)
    let mapObj = null;
    if (mappingJson) {
        if (typeof mappingJson === "string") {
            try {
                // Try standard JSON first
                mapObj = JSON.parse(mappingJson);
            } catch (e) {
                try {
                    // Fallback: Convert Python-style dict (single quotes) to JSON
                    const normalized = mappingJson.replace(/'/g, '"');
                    mapObj = JSON.parse(normalized);
                } catch (e2) {
                    console.error("Failed to parse mapping JSON", e2);
                    mapObj = null;
                }
            }
        } else if (typeof mappingJson === "object") {
            mapObj = mappingJson;
        }

        // Add keys to highlight list
        if (mapObj && typeof mapObj === "object") {
            Object.keys(mapObj).forEach(k => varsToHighlight.add(k));
        }
    }

    // 3. Define Linting Logic (Restored from Old Version)
    const highlightText = (text) => {
        // A. Highlight single-quoted items explicitly (e.g. 'mass_1')
        text = text.replace(/'([^']+)'/g, `<span class="qa-variable">$1</span>`);

        if (varsToHighlight.size === 0) return text;

        // B. Highlight variables
        // Sort by length (longest first) to prevent partial matching
        const sortedVars = Array.from(varsToHighlight).sort((a, b) => b.length - a.length);

        // Robust regex using Lookbehind/Lookahead for word boundaries
        const varPattern = sortedVars
            .map(v => `(?<![A-Za-z0-9_])${v}(?![A-Za-z0-9_])`)
            .join('|');

        // Match either an HTML tag (Group 1) OR a variable (Group 2)
        const regex = new RegExp(`(<[^>]+>)|(${varPattern})`, 'g');

        return text.replace(regex, (match, tag, variable) => {
            // If it matched a tag, return it as-is (don't break HTML)
            if (tag) return tag;
            // If it matched a variable, wrap it
            if (variable) return `<span class="qa-variable">${variable}</span>`;
            return match;
        });
    };

    // Apply linting to both Description and Question
    descriptionText = highlightText(descriptionText);
    questionText = highlightText(questionText);

    // 4. Construct Final HTML (New Layout)
    let html = `
        <div class="qa-label">Description</div>
        <div style="margin:0px; line-height:1.8;">${descriptionText}</div>

        <div class="qa-label">Question</div>
        <div style="margin:0px; line-height:1.8;">${questionText}</div>

        <div class="qa-label">Answer</div>
        <div style="margin:0px; font-weight:bold; color:#209cee;">${answerText}</div>
    `;

    // 5. Append Mapping Table
    if (mapObj) {
        const rows = Object.entries(mapObj)
            .map(([key, value]) => {
                let displayValue = value;

                // Restored Old Version's numeric checking (handles strings like "5.50")
                if (typeof value === "number") {
                    displayValue = value.toFixed(2);
                } else if (!isNaN(Number(value))) {
                    displayValue = Number(value).toFixed(2);
                }

                return `
                    <tr>
                        <td style="padding:6px 10px; border:1px solid #ccc; font-family:monospace;">${key}</td>
                        <td style="padding:6px 10px; border:1px solid #ccc; text-align:right; font-family:monospace;">${displayValue}</td>
                    </tr>
                `;
            })
            .join("");

        html += `
            <div class="qa-label">Symbolic Mapping</div>
            <table style="
                border-collapse: collapse;
                border: 1px solid #ccc;
                background: #fff;
                font-size: 0.9rem;
                margin-top: 8px;
            ">
                <thead>
                    <tr style="background:#f0f0f0;">
                        <th style="padding:6px 10px; border:1px solid #ccc; text-align:left;">Symbol</th>
                        <th style="padding:6px 10px; border:1px solid #ccc; text-align:right;">Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    } else if (mappingJson) {
        // Fallback if parsing failed but text exists
        html += `
            <div class="qa-label">Symbolic Mapping</div>
            <pre style="padding:10px; border:1px solid #ccc;">${mappingJson}</pre>
        `;
    }

    return html;
}

// --- Helper: Custom Linter/Highlighter for Physics Reasoning ---
function formatExampleOutput(text) {
    let html = text;

    // 1. Highlight Headers (### Title)
    // Converts "### Answer 1" to a styled bold header
    html = html.replace(/^### (.*$)/gm, '<div class="title is-5" style="margin-bottom: 0.5em; color: #333;">$1</div>');

    // 2. Highlight Steps (Step 1:)
    html = html.replace(/^(Step \d+:)/gm, '<br><strong style="color: #209cee;">$1</strong>');

    // 3. Highlight Verdicts (CORRECT / INCORRECT / ERROR)
    html = html.replace(/\b(CORRECT)\b/g, '<span style="color: #23d160; font-weight: bold; background: #ebffef; padding: 2px 6px; border-radius: 4px;">$1</span>');
    html = html.replace(/\b(INCORRECT|ERROR)\b/g, '<span style="color: #ff3860; font-weight: bold; background: #ffebeb; padding: 2px 6px; border-radius: 4px;">$1</span>');

    // 4. Highlight Math Variables (heuristic: v_sun, M_Earth)
    // Matches words with underscores (e.g., v_total)
    html = html.replace(/\b([a-zA-Z]+_[a-zA-Z0-9]+)\b/g, '<span style="color: #d05ce3; font-family: monospace;">$1</span>');

    // 5. Highlight Comments/Reasoning markers (>> or <--)
    html = html.replace(/(\>\>|\<--)(.*)/g, '<span style="color: #888; font-style: italic;">$1$2</span>');

    return html;
}

// ─── Example Viewer (JSON-driven, arrow navigation) ────────────────────────

const exampleKeys = ["sun_earth_escape", "rotation", "projectile", "shm", "ill_fated_satellite", "maribo_meteorite"];
let exampleIndex = 0;

function navigateExample(delta) {
    exampleIndex = (exampleIndex + delta + exampleKeys.length) % exampleKeys.length;
    loadExample(exampleKeys[exampleIndex]);
}

// Simple markdown-ish text → HTML: bold, inline code, line breaks
function mdToHtml(text) {
    if (!text) return '';

    // Step 1: Extract $$...$$ display math blocks (keep them as-is, just
    //         collapse internal newlines so they don't get turned into <br>).
    const displayBlocks = [];
    let s = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
        displayBlocks.push('$$' + inner.replace(/\n/g, ' ') + '$$');
        return '\x00D' + (displayBlocks.length - 1) + '\x00';
    });

    // Step 2: Process Markdown-style formatting
    s = s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Step 3: Convert remaining inline $...$ → \(...\) so MathJax v3
    //         renders them with its default-enabled inline delimiter.
    s = s.replace(/\$([^$\n]+?)\$/g, (_, inner) => '\\(' + inner + '\\)');

    // Step 4: Convert newlines to <br>
    s = s.replace(/\n/g, '<br>');

    // Step 5: Restore display math blocks
    s = s.replace(/\x00D(\d+)\x00/g, (_, i) => displayBlocks[parseInt(i)]);

    return s;
}

function renderSteps(steps, container) {
    container.innerHTML = '';
    steps.forEach(s => {
        const div = document.createElement('div');
        div.className = `ex-step type-${s.type}`;
        div.innerHTML = `<div class="ex-step-label">${mdToHtml(s.label)}</div><div class="ex-step-text">${mdToHtml(s.text)}</div>`;
        container.appendChild(div);
    });
}

function loadExample(key) {
    const titleEl = document.getElementById('ex-title');
    const sourceEl = document.getElementById('ex-source');
    const qBody = document.getElementById('ex-question-body');
    const baseBody = document.getElementById('ex-base-body');
    const rlBody = document.getElementById('ex-rl-body');

    if (!titleEl) return;

    // Show loading state
    [qBody, baseBody, rlBody].forEach(el => { if (el) el.style.opacity = '0.4'; });

    fetch(`./static/${key}/data.json`)
        .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
        .then(data => {
            // Title + source
            if (titleEl) titleEl.textContent = data.title || key;
            if (sourceEl) sourceEl.textContent = data.title || '';

            // Question
            if (qBody) {
                qBody.innerHTML = mdToHtml(data.question || '');
            }

            // Base model steps
            if (baseBody && data.base) renderSteps(data.base, baseBody);

            // RL steps
            if (rlBody && data.rl) renderSteps(data.rl, rlBody);

            // Re-run MathJax on the whole new content
            if (window.MathJax && MathJax.typesetPromise) {
                const containers = [
                    document.getElementById('ex-question'),
                    baseBody,
                    rlBody
                ].filter(Boolean);
                MathJax.typesetPromise(containers).catch(e => console.warn('MathJax:', e));
            }
        })
        .catch(err => {
            if (titleEl) titleEl.textContent = key;
            if (qBody) qBody.textContent = 'Error loading example: ' + err.message;
        })
        .finally(() => {
            [qBody, baseBody, rlBody].forEach(el => { if (el) el.style.opacity = '1'; });
        });
}

// 5. Start Everything when DOM is ready
// index.js loads at the bottom of <body>, so DOMContentLoaded has already fired.
function _initAll() {
    initSelectors();
    // Load the first example (sets title from JSON)
    loadExample(exampleKeys[0]);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initAll);
} else {
    _initAll();
}


$(document).ready(function () {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function () {
        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
        slidesToScroll: 1,
        slidesToShow: 3,
        loop: true,
        infinite: true,
        autoplay: false,
        autoplaySpeed: 3000,
    }

    // Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for (var i = 0; i < carousels.length; i++) {
        // Add listener to  event
        carousels[i].on('before:show', state => {
            console.log(state);
        });
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
        // bulmaCarousel instance is available as element.bulmaCarousel
        element.bulmaCarousel.on('before-show', function (state) {
            console.log(state);
        });
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/

})

// https://stackoverflow.com/a/47591788/5487412
$(document).ready(function () {
    $('#tabs li').on('click', function () {
        var tab = $(this).data('tab');

        $('#tabs li').removeClass('is-active');
        $(this).addClass('is-active');

        $('#tab-content div').removeClass('is-active');
        $('div[data-content="' + tab + '"]').addClass('is-active');
    });
});

// play video on mouseover
var mp4Gif = document.getElementsByClassName('mp4-gif');
for (var i = 0; i < mp4Gif.length; i++) {
    mp4Gif[i].addEventListener('mouseover', function () {
        this.play();
    }, false);
}

// method overview
var methodOverviewWrapper = document.getElementById('method-overview-wrapper');
if (methodOverviewWrapper) {
    methodOverviewWrapper.onclick = function (ev) {
        var target = ev.target;
        const rect = target.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        var width = methodOverviewWrapper.offsetWidth;
        var height = methodOverviewWrapper.offsetHeight;
        var horizontal = (x < width / 2) ? "left" : "right";
        var vertical = (y < height / 2) ? "top" : "bottom";
        var id = "method-overview-" + vertical + "-" + horizontal;
        if (id == current) {
            return;
        }
        $(".method-overview").hide();
        $("." + id).show();
    }
}


// bibtex copy
// https://www.roboleary.net/2022/01/13/copy-code-to-clipboard-blog.html

const copyButtonLabel = "copy";

// use a class selector if available
let blocks = document.querySelectorAll("pre");

blocks.forEach((block) => {
    // only add button if browser supports Clipboard API
    if (navigator.clipboard) {
        let button = document.createElement("button");

        button.innerText = copyButtonLabel;
        block.appendChild(button);

        button.addEventListener("click", async () => {
            await copyCode(block, button);
        });
    }
});

async function copyCode(block, button) {
    let code = block.querySelector("code");
    let text = code.innerText;

    await navigator.clipboard.writeText(text);

    // visual feedback that task is completed
    button.innerText = "citation copied!";

    setTimeout(() => {
        button.innerText = copyButtonLabel;
    }, 700);
}


window.MathJax = {
    tex: {
        tags: 'ams'
    }
};