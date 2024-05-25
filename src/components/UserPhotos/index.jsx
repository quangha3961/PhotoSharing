import React, { useState, useEffect }  from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  List,
  Divider,
  Typography,
  Grid,
  Avatar,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
} from "@material-ui/core";
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { ThumbUp, ThumbUpOutlined } from "@material-ui/icons";
import axios from "axios";
axios.defaults.withCredentials = true
import CommentDialog from "../CommentDialog/index";
import { SERVER_URL } from '../../config'


function UserPhotos(props) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState(null);
  const {userId, loginUser2} = useParams()
  const axios_fetch_user = userID => {
    axios.get(`${SERVER_URL}/user2/${userID}`) 
        .then(response => {
          setUser(response.data);
          props.onUserNameChange(response.data.first_name + " " + response.data.last_name);
          props.onLoginUserChange({ first_name: response.data.logged_user_first_name,
            last_name: response.data.logged_user_last_name,
            id: response.data.logged_user_id  });
        })

  };
  const axios_fetch_photos = userID => {
    axios.get(`${SERVER_URL}/photosOfUser/${userID}`)
        .then(response => {
          setPhotos(response.data);
        })
  };

  useEffect(() => {
    axios_fetch_user(userId);
  }, [userId]);

  useEffect(() => {
    axios_fetch_photos(userId);
  }, [props.photoIsUploaded]);

  const handleCommentSumbit = () => {
    axios_fetch_user(userId);
    axios_fetch_photos(userId);
  };

  const axios_post_handle = (url, info, errMsg) => {
    axios.post(url, info)
        .then(() => axios_fetch_photos(userId))
  };
  const handlePhotoLike = photo_id => {
    axios_post_handle(`${SERVER_URL}/like/${photo_id}`, {action: props.loginUser.id}, "Like Update Failure: ");
  };
  const handlePhotoDelete = photo_id => {
    axios_post_handle(`${SERVER_URL}/deletePhoto/${photo_id}`, {}, "Photo Delete Failure: ");
  };
  const handleCommentDetele = (comment_id, photo_id) => {
    axios_post_handle(`${SERVER_URL}/deleteComment/${comment_id}`, {photo_id: photo_id}, "Comment Delete Failure: ");
  };
  const convertDate = isoDate => {
    const date = new Date(isoDate);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const likedByLoginUser = photo => {
    for (let i = 0; i < photo.likes.length; i++) {
      if (photo.likes[i]._id === props.loginUser.id) return true;
    }
    return false;
  };

  const likesNameList = photo => {
    const nameList = photo.likes.map( like => {
      let name = like.first_name + " " + like.last_name;
      return name;
    });
    return nameList;
  };
  if (props.loginUser || !user.most || !photos) {
    return (user &&
            <div style={{ height: "calc(100vh - 64px)", overflowY: "auto" }}>
              <Grid container justifyContent="flex-start" spacing={3} justify="center" alignItems="center">
                {photos && photos.map(photo => (
                    <Grid item xs={7} key={photo._id}>
                      <Card style={{ border: "0.1px solid #d8d8d8", "box-shadow": "none" }}>
                        <CardHeader
                            avatar={(
                                <Avatar src={`${SERVER_URL}/images/${user.mostRecentPhotoName}`}>
                                  {user.first_name[0]}
                                </Avatar>
                            )}
                            title={(
                                <Link to={`/users/${user._id}`}>
                                  <Typography>{`${user.first_name} ${user.last_name}`}</Typography>
                                </Link>
                            )}
                            subheader={photo.date_time}
                            action={props.loginUser.id === user._id && (
                                <IconButton title="Remove the photo" onClick={() => handlePhotoDelete(photo._id)}>
                                  <DeleteOutlineIcon />
                                </IconButton>
                            )}
                        />

                        <CardMedia
                            component="img"
                            image={`${SERVER_URL}/images/${photo.file_name}`}
                            alt="Anthor Post"
                        />

                        <Typography variant="button" style={{ marginLeft: "6px", textTransform: "none"}}>
                          {photo.likes.length > 0 ?
                              `Liked by ${likesNameList(photo).map(name => name).join(", ")}` : ``}
                        </Typography>

                        <CardActions style={{ paddingBottom: "0" }}>
                          <Button onClick={() => handlePhotoLike(photo._id)} style={{ margin: "0 auto" }}>
                            {likedByLoginUser(photo) ? <ThumbUp color="secondary" /> : <ThumbUpOutlined color="action" />}
                            <Typography variant="button" style={{ marginLeft: "5px"}} >
                              {photo.likes.length}
                            </Typography>
                          </Button>
                        </CardActions>

                        <CardContent style={{ paddingTop: "0" }}>
                          {photo.comments && (
                              <Typography variant="subtitle1">
                                Comments:
                                <Divider/>
                              </Typography>
                          )}
                          {photo.comments.map(c => (
                              <List key={c._id}>
                                <Typography variant="subtitle2">
                                  <Link to={`/users/${c.user._id}`}>
                                    {`${c.user.first_name} ${c.user.last_name}`}
                                  </Link>
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    gutterBottom
                                >
                                  {convertDate(c.date_time)}
                                  {/* Button for removing each comment */}
                                  {props.loginUser.id === user._id && (
                                      <IconButton title="Delete the comment" onClick={() => handleCommentDetele(c._id, photo._id)}>
                                        <DeleteOutlineIcon fontSize="small"  />
                                      </IconButton>
                                  )}
                                </Typography>
                                <Typography variant="body1">
                                  {`"${c.comment}"`}
                                </Typography>
                              </List>
                          ))}
                          <CommentDialog
                              onCommentSumbit={handleCommentSumbit}
                              photo_id={photo._id}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                ))}

                {!photos && (
                    <Grid item xs={12}>
                      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: "80vh" }}>
                        <Typography>
                          This user has not posted any photos yet.
                        </Typography>
                      </Grid>
                    </Grid>
                )}

              </Grid>
            </div>
    );
  }
  return navigate(`/login-register`)
}


export default UserPhotos;