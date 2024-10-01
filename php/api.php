<?php

// function to parse the http auth header
function http_digest_parse($txt)
{
    // protect against missing data
    $needed_parts = array('nonce' => 1, 'nc' => 1, 'cnonce' => 1, 'qop' => 1, 'loginname' => 1, 'uri' => 1, 'response' => 1);
    $data = array();
    $keys = implode('|', array_keys($needed_parts));

    preg_match_all('@(' . $keys . ')=(?:([\'"])([^\2]+?)\2|([^\s,]+))@', $txt, $matches, PREG_SET_ORDER);

    foreach ($matches as $m) {
        $data[$m[1]] = $m[3] ? $m[3] : $m[4];
        unset($needed_parts[$m[1]]);
    }

    return $needed_parts ? false : $data;
}

function init_db()
{
    $db = new SQLite3("data/db.sqlite");
    $db->exec("PRAGMA foreign_keys=ON");
    $db->exec("CREATE TABLE IF NOT EXISTS user(login VARCHAR NOT NULL UNIQUE, password VARCHAR, isAdmin BOOL)");
    $db->exec("CREATE TABLE IF NOT EXISTS todo(id INTEGER PRIMARY KEY ASC NOT NULL, login VARCHAR NOT NULL, parent INTEGER REFERENCES todo(id), data VARCHAR NOT NULL)");

    $result = $db->query("PRAGMA table_info(todo)");
    $hasCategory = false;
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
        if ($row[1] == 'category') {
            $hasCategory = 'true';
        }
    }
    if ($hasCategory) {
        $db->exec("BEGIN");
        $db->exec("CREATE TABLE IF NOT EXISTS todo_tmp(id INTEGER PRIMARY KEY ASC NOT NULL, login VARCHAR NOT NULL, parent INTEGER REFERENCES todo_tmp(id), data VARCHAR NOT NULL)");
        $db->exec("DELETE FROM todo_tmp");
        $db->exec("INSERT INTO todo_tmp(login,data) SELECT login,'{\"name\":\"'||category||'\",\"text\":\"\",\"priority\":5,\"ctime\":0}' FROM todo GROUP BY category");
        $db->exec("INSERT INTO todo_tmp(login,data,parent) SELECT todo.login,todo.data,todo_tmp.id FROM todo LEFT JOIN todo_tmp ON todo.category=json_extract(todo_tmp.data,'$.name')");
        $db->exec("ALTER TABLE todo RENAME TO todo_old");
        $db->exec("ALTER TABLE todo_tmp RENAME TO todo");
        $db->exec("COMMIT");
    }

    $db->exec("CREATE INDEX IF NOT EXISTS todo_login_idx ON todo(login)");
    $db->exec("CREATE INDEX IF NOT EXISTS todo_id_idx ON todo(id)");
    $db->exec("DROP INDEX IF EXISTS todo_idx");
    return ($db);
}

function fix_user($db, $id, $login)
{
    $query = $db->prepare("UPDATE todo SET login=:login WHERE parent=:parent");
    $query->bindValue(":login", $login);
    $query->bindValue(":parent", $id);
    $query->execute();

    $query = $db->prepare("SELECT id FROM todo WHERE parent=:parent");
    $query->bindValue(":parent", $id);
    $result = $query->execute();
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
        fix_user($db, $row[0], $login);
    }
}

function fix_delete($db, $id)
{
    $query = $db->prepare("SELECT id FROM todo WHERE parent=:parent");
    $query->bindValue(":parent", $id);
    $result = $query->execute();
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
        fix_delete($db, $row[0]);
    }
    $query = $db->prepare("DELETE FROM todo WHERE parent=:parent");
    $query->bindValue(":parent", $id);
    $query->execute();
}

function get_list($db, $parent)
{
    $ret = array();
    $checked = 0;
    $unchecked = 0;
    $query = $db->prepare("SELECT id,data FROM todo WHERE parent=:parent ORDER BY json_extract(data,'$.priority'),lower(json_extract(data,'$.name'))");
    $query->bindValue(":parent", $parent);
    $result = $query->execute();
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
        $val = json_decode($row[1], true);
        $sub = get_list($db, $row[0]);
        $val["id"] = $row[0];
        $val["parentId"] = $parent;
        $val["sub"] = $sub["sub"];
        $val["checked"] = $sub["checked"];
        $val["unchecked"] = $sub["unchecked"];
        if ($val["priority"] > 0) {
            if (isset($val["checkTime"])) {
                $checked++;
            } else {
                $unchecked++;
            }
        }
        $checked += $sub["checked"];
        $unchecked += $sub["unchecked"];
        array_push($ret, $val);
    }
    $ret["sub"] = $ret;
    $ret["checked"] = $checked;
    $ret["unchecked"] = $unchecked;
    return ($ret);
}

function get_flat_list($db, $login)
{
    $ret = array();
    $query = $db->prepare("SELECT id,json_extract(data,'$.name'),json_extract(data,'$.checkTime'),parent FROM todo WHERE login=:login ORDER BY lower(json_extract(data,'$.name'))");
    $query->bindValue(":login", $login);
    $result = $query->execute();
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
        if (isset($row[2])) {
            continue;
        }
        $val = json_decode('{}', true);
        $val["id"] = $row[0];
        $val["name"] = $row[1];
        if (isset($row[3])) {
            $val["level"] = 1;
        } else {
            $val["level"] = 0;
        }
        array_push($ret, $val);
    }
    return ($ret);
}


header('Access-Control-Allow-Origin: *');
$cmd = "";
$ret = array();
$login = "";
$isAdmin = false;
$othersEnabled = true;
$db = null;

if (isset($_SERVER['TLS_CLIENT_DN'])) {
    $TLS_DN = explode(",", $_SERVER['TLS_CLIENT_DN']);
    foreach ($TLS_DN as $v) {
        if (str_starts_with($v, "CN=")) {
            $login = strtolower(substr($v, 3));
            break;
        }
    }
}

//error_log(print_r($_SERVER, TRUE));
if (strlen($login) == 0 && isset($_SERVER["HTTP_X_AUTH"])) {
    $db = init_db();
    list($auth_login, $auth_token) = explode(":", $_SERVER["HTTP_X_AUTH"]);
    $query = $db->prepare("SELECT password FROM user WHERE login=:login AND password IS NOT NULL");
    $query->bindValue(":login", $auth_login);
    $result = $query->execute();
    if ($row = $result->fetchArray(SQLITE3_NUM)) {
        $password = $row[0];
        if (strlen($password) > 0 && strlen($auth_token) > 0 && $password == $auth_token) {
            $login = $auth_login;
        }
    }
}

if (strlen($login) == 0) {
    if ($_SERVER["SERVER_PORT"] == "3001") {
        $login = "anonymous";
    } else {
        header('HTTP/1.1 401 Unauthorized');
        die('Auth failed');
    }
}

if ($db == null) {
    $db = init_db();
}
$query = $db->prepare("SELECT login,isAdmin FROM user WHERE login=:login");
$query->bindValue(":login", $login);
$result = $query->execute();
if ($row = $result->fetchArray(SQLITE3_NUM)) {
    $isAdmin = $row[1];
} else {
    $query = $db->prepare("INSERT INTO user(login) VALUES(:login)");
    $query->bindValue(":login", $login);
    $result = $query->execute();
}

if (isset($_GET["cmd"])) {
    $cmd = $_GET["cmd"];
}

if ($othersEnabled && isset($_GET["otherName"])) {
    $otherName = $_GET["otherName"];
}

if ($cmd == "set" && !isset($otherName)) {
    $db->exec("BEGIN");
    $val = json_decode(file_get_contents('php://input'), true);
    $id = $val["id"];
    $parent_id = isset($val["parentId"]) ? $val["parentId"] : -1;
    $target_login = isset($val["login"]) ? $val["login"] : $login;
    unset($val["id"]);
    unset($val["parentId"]);
    unset($val["login"]);
    unset($val["sub"]);
    if ($login != $target_login) {
        if ($id > 0) {
            fix_user($db, $id, $target_login);
        }
        //check inbox exists
        $queryInbox = $db->prepare("SELECT id FROM todo WHERE login=:login AND json_extract(data,'$.name') = ' INBOX'");
        $queryInbox->bindValue(":login", $target_login);
        $result = $queryInbox->execute();
        $tmp_id = -1;
        if ($row = $result->fetchArray(SQLITE3_NUM)) {
            $tmp_id = $row[0];
            error_log('inbox ok');
        } else {
            $insert = $db->prepare("INSERT INTO todo(login,data) VALUES(:login,:data) RETURNING id");
            $insert->bindValue(":login", $target_login);
            $insert->bindValue(":data", '{"name":" INBOX","text":"","priority":3,"ctime":1187660262000}');
            $insert->execute();
            $result = $queryInbox->execute();
            if ($row = $result->fetchArray(SQLITE3_NUM)) {
                $tmp_id = $row[0];
                $result->finalize();
            }
            error_log('inbox created ' . $tmp_id);
        }
        if ($tmp_id > 0) {
            //check inbox for login
            $queryInbox = $db->prepare("SELECT id FROM todo WHERE parent=:parent AND json_extract(data,'$.name')=:name");
            $queryInbox->bindValue(":parent", $tmp_id);
            $queryInbox->bindValue(":name", $login);
            $result = $queryInbox->execute();
            if ($row = $result->fetchArray(SQLITE3_NUM)) {
                $parent_id = $row[0];
                error_log('inbox user ok');
            } else {
                $insert = $db->prepare("INSERT INTO todo(login,parent,data) VALUES(:login,:parent,:data) RETURNING id");
                $insert->bindValue(":login", $target_login);
                $insert->bindValue(":parent", $tmp_id);
                $insert->bindValue(":data", '{"name":"' . $login . '","text":"","priority":3,"ctime":1187660262000}');
                $insert->execute();
                $result = $queryInbox->execute();
                if ($row = $result->fetchArray(SQLITE3_NUM)) {
                    $parent_id = $row[0];
                    $result->finalize();
                }
                error_log('inbox user created ' . $parent_id);
            }
        }
    }
    if ($id > 0) {
        $query = $db->prepare("UPDATE todo SET login=:login,data=:data WHERE id=:id");
        $query->bindValue(":login", $target_login);
        $query->bindValue(":data", json_encode($val));
        $query->bindValue(":id", $id);
        $query->execute();
        if ($parent_id > 0) {
            $query = $db->prepare("UPDATE todo SET parent=:parent WHERE id=:id");
            $query->bindValue(":parent", $parent_id);
            $query->bindValue(":id", $id);
            $query->execute();
        }
    } else {
        if ($parent_id > 0) {
            $query = $db->prepare("INSERT INTO todo(login,parent,data) VALUES(:login,:parent,:data)");
            $query->bindValue(":login", $target_login);
            $query->bindValue(":parent", $parent_id);
            $query->bindValue(":data", json_encode($val));
            $query->execute();
        } else {
            $query = $db->prepare("INSERT INTO todo(login,data) VALUES(:login,:data)");
            $query->bindValue(":login", $target_login);
            $query->bindValue(":data", json_encode($val));
            $query->execute();
        }
    }
    $db->exec("COMMIT");
}

if ($cmd == "setParent" && !isset($otherName)) {
    $id = $_GET["id"];
    $parent = $_GET["parentId"];
    if ($parent > 0) {
        $query = $db->prepare("UPDATE todo SET parent=:parent WHERE id=:id");
        $query->bindValue(":parent", $parent);
        $query->bindValue(":id", $id);
        $query->execute();
    } else {
        $query = $db->prepare("UPDATE todo SET parent=null WHERE id=:id");
        $query->bindValue(":id", $id);
        $query->execute();
    }
}

if ($cmd == "delete" && isset($_GET["id"]) && !isset($otherName)) {
    $db->exec("BEGIN");
    $id = $_GET["id"];
    fix_delete($db, $id);
    $query = $db->prepare("DELETE FROM todo WHERE id=:id AND login=:login");
    $query->bindValue(":id", $id);
    $query->bindValue(":login", $login);
    $query->execute();
    $db->exec("COMMIT");
}

if ($cmd == "cleanup" && !isset($otherName)) {
    $db->exec("BEGIN");
    $query = $db->prepare("DELETE FROM todo WHERE login=:login AND json_extract(data,'$.checkTime')>0");
    $query->bindValue(":login", $login);
    $query->execute();
    $db->exec("COMMIT");
}


if ($cmd == "list") {
    $query = $db->prepare("SELECT id,data FROM todo WHERE login=:login AND parent IS NULL ORDER BY lower(json_extract(data,'$.name'))");
    if (isset($otherName)) {
        $query->bindValue(":login", $otherName);
    } else {
        $query->bindValue(":login", $login);
    }
    $result = $query->execute();
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
        $val = json_decode($row[1], true);
        $sub = get_list($db, $row[0]);
        $val["id"] = $row[0];
        $val["parentId"] = -1;
        $val["sub"] = $sub["sub"];
        $val["checked"] = $sub["checked"];
        $val["unchecked"] = $sub["unchecked"];
        array_push($ret, $val);
    }
}

if ($cmd == "flatList") {
    $ret = get_flat_list($db, $login, 0);
    error_log('flatList res: ' . count($ret));
}

if ($cmd == "loginList") {
    $query = $db->prepare("SELECT login FROM user ORDER BY login");
    $result = $query->execute();
    while ($row = $result->fetchArray(SQLITE3_NUM)) {
        array_push($ret, $row[0]);
    }
}

if ($cmd == "me") {
    $ret["login"] = $login;
    $ret["isAdmin"] = $isAdmin;
    $ret["othersEnabled"] = $othersEnabled;
}

if ($isAdmin) {
    if ($cmd == "adminUserList") {
        $query = $db->prepare("SELECT login,password,isAdmin FROM user ORDER BY login");
        $result = $query->execute();
        while ($row = $result->fetchArray(SQLITE3_NUM)) {
            $val = [];
            $val["login"] = $row[0];
            $val["hasPassword"] = strlen($row[1]) > 0;
            $val["isAdmin"] = $row[2];
            array_push($ret, $val);
        }
    } else if ($cmd == "adminUserOne" && isset($_GET["login"])) {
        $query = $db->prepare("SELECT login,password,isAdmin FROM user WHERE login=:login");
        $query->bindValue(":login", strtolower($_GET["login"]));
        $result = $query->execute();
        if ($row = $result->fetchArray(SQLITE3_NUM)) {
            $ret["login"] = $row[0];
            $ret["hasPassword"] = strlen($row[1]) > 0;
            $ret["isAdmin"] = $row[2];
        }
    } else if ($cmd == "adminUserAdd" && isset($_GET["login"])) {
        $query = $db->prepare("INSERT INTO user(login) VALUES(:login)");
        $query->bindValue(":login", strtolower($_GET["login"]));
        $result = $query->execute();
    } else if ($cmd == "adminUserDelete" && isset($_GET["login"])) {
        $query = $db->prepare("DELETE FROM user WHERE login=:login");
        $query->bindValue(":login", strtolower($_GET["login"]));
        $result = $query->execute();
        $query = $db->prepare("DELETE FROM todo WHERE login=:login");
        $query->bindValue(":login", strtolower($_GET["login"]));
        $result = $query->execute();
    } else if ($cmd == "adminUserSetAdmin" && isset($_GET["login"]) && isset($_GET["admin"])) {
        $query = $db->prepare("UPDATE user SET isAdmin=:isAdmin WHERE login=:login");
        $query->bindValue(":isAdmin", $_GET["admin"] == "true");
        $query->bindValue(":login", strtolower($_GET["login"]));
        $result = $query->execute();
    } else if ($cmd == "adminUserSetPassword" && isset($_GET["login"]) && isset($_GET["password"])) {
        $set_password = $_GET["password"];
        $set_login = $_GET["login"];
        if (strlen($set_password) > 0) {
            $new_password = str_replace(['+', '/', '='], ['', '', ''], base64_encode(random_bytes(14)));
            $set_password = hash('sha256', $set_login . $new_password);
        }
        $query = $db->prepare("UPDATE user SET password=:password WHERE login=:login");
        $query->bindValue(":password", $set_password);
        $query->bindValue(":login", $set_login);
        $result = $query->execute();
        $ret["login"] = $set_login;
        $ret["newPassword"] = $new_password;
    }
}

$db->close();
echo json_encode($ret);
echo "\n";
