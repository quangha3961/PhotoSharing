import React, { useState, useEffect }  from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemText, ListItemIcon, Typography, Divider } from "@material-ui/core";
import axios from "axios";
axios.defaults.withCredentials = true
import {
  PersonOutlineOutlined,
  Person,
} from "@material-ui/icons";
import "./userList.css";
import {SERVER_URL} from "../../config";
function UserList(props) {

  const [users, setUser] = useState(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(null);
  const axios_fetchUser = () => {
    axios
        .get(`${SERVER_URL}/user/list`)
        .then(response => {
          console.log("** UserList: fetched User List **");
          setUser(response.data);
        })
        .catch(error => {
          console.log(`** UserList Error: ${error.message} **`);
        });
  };
  useEffect(() => {
    axios_fetchUser();
  }, [props.loginUser]);

//   function PhotoComments({ photo }) {
//     useEffect(() => {
//         console.log("Comments for", photo.file_name, ":", photo.comments);
//     }, [photo]);

//     return null; // Hoặc bạn có thể trả về một phần tử JSX trống nếu cần
// }
// PhotoComments()
  const handleClick = index => setSelectedButtonIndex(index);
  let userList;
  if (users && props.loginUser) {
    userList = users.map((user, index) => (
        <React.Fragment key={index}>
          <ListItem
              to={`/users/${user._id}`}
              component={Link} onClick={() => handleClick(index)}
              button
              style={{ backgroundColor: selectedButtonIndex === index ? "#141414" : "",
                  color: selectedButtonIndex === index ? "#ffff" : "", borderRadius: "30px" }}
          >
              {/* Selected style for button icons */}
              {/* {
                  selectedButtonIndex === index ?
                      <ListItemIcon><Person fontSize="medium" style={{ color: "#ffff" }}/></ListItemIcon> :
                      <ListItemIcon><PersonOutlineOutlined fontSize="medium" /></ListItemIcon>
              } */}
              <ListItemText primary={
                  <Typography variant="h7">{user.first_name +  " " + user.last_name + (props.loginUser.id === user._id ? " (Me)" : "")}</Typography>
              } />
          </ListItem>
        </React.Fragment>
    ));
  }


  return <List component="nav">{userList}</List>;
}

export default UserList;