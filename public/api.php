<?php
header('Access-Control-Allow-Origin: *');
$cmd = "";
$ret = array();
$user = "";
$db = new SQLite3("data/db.sqlite");
$db->exec("CREATE TABLE IF NOT EXISTS user(name VARCHAR NOT NULL)");
$db->exec("CREATE TABLE IF NOT EXISTS todo(user VARCHAR NOT NULL, category VARCHAR NOT NULL,data VARCHAR NOT NULL)");
$db->exec("CREATE INDEX IF NOT EXISTS todo_idx ON todo(user)");

$TLS_DN = explode(",",$_SERVER['TLS_CLIENT_DN']);
foreach($TLS_DN as $v){
    if(str_starts_with($v,"O=")){
        $user = strtolower(substr($v,2));
        break;
    }
}

if(strlen($user) == 0){
        error_log("Empty user");
        return;
}

$query = $db->prepare("SELECT name FROM user WHERE name=:name");
$query->bindValue(":name", $user);
$result = $query->execute();
if (!$result->fetchArray(SQLITE3_NUM)) {
    $query = $db->prepare("INSERT INTO user(name) VALUES(:name)");
    $query->bindValue(":name", $user);
    $result = $query->execute();
}

if (isset($_GET["cmd"])) {
        $cmd = $_GET["cmd"];
}

if ($cmd == "set") {
        $val = json_decode(file_get_contents('php://input'),true);
        $id = $val["id"];
        $target_user = $user;
        $target_category = $val["category"];
        unset($val["id"]);
        if(isset($val["user"])){
            $target_user = $val["user"];
            $target_category = "00_".$user;
            $val["category"] = $target_category;
            unset($val["user"]);
        }
        if($id > 0){
                $query = $db->prepare("UPDATE todo SET category=:category,user=:user,data=:data WHERE oid=:oid");
                $query->bindValue(":category", $target_category);
                $query->bindValue(":user", $target_user);
                $query->bindValue(":data", json_encode($val));
                $query->bindValue(":oid", $id);
                $result = $query->execute();
        } else {
                $query = $db->prepare("INSERT INTO todo(user,category,data) VALUES(:user,:category,:data)");
                $query->bindValue(":user", $target_user);
                $query->bindValue(":category", $target_category);
                $query->bindValue(":data", json_encode($val));
                $result = $query->execute();
        }
}

if($cmd == "delete" && isset($_GET["id"])){
        $id = $_GET["id"];
        $query = $db->prepare("DELETE FROM todo WHERE oid=:oid");
        $query->bindValue(":oid", $id);
        $result = $query->execute();
}

if ($cmd == "list") {
        $query = $db->prepare("SELECT oid,category,data FROM todo WHERE user=:user");
        $query->bindValue(":user", $user);
        $result = $query->execute();
        while ($row = $result->fetchArray(SQLITE3_NUM)) {
                $category = $row[1];
                $val = json_decode($row[2], true);
                $val["id"] = $row[0];
                if (!isset($ret[$category])) {
                        $ret[$category] = array();
                }
                array_push($ret[$category], $val);
        }
}

if ($cmd == "userList") {
        $query = $db->prepare("SELECT name FROM user ORDER BY name");
        $result = $query->execute();
        while ($row = $result->fetchArray(SQLITE3_NUM)) {
                array_push($ret, $row[0]);
        }
}

$db->close();
echo json_encode($ret);
echo "\n";
?>
