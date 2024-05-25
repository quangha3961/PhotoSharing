import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Button,
    Grid,
    Typography,
    Card,
    CardMedia,
    CardContent,
    CardActionArea,
    Avatar,
} from "@material-ui/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./userDetail.css";
import axios from "axios";
import { SERVER_URL } from "../../config";
import Modal from 'react-modal';
import { useDropzone } from 'react-dropzone';

axios.defaults.withCredentials = true;
Modal.setAppElement('#root');

function UserDetail(props) {
    const [photoIsUploaded, setPhotoIsUploaded] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadStatus, setUploadStatus] = useState("");
    const navigate = useNavigate();
    const { userId } = useParams();
    const [user, setUser] = useState(null);

    const axios_fetchUserFrom = (url) => {
        axios
            .get(url)
            .then((response) => {
                props.onUserNameChange(
                    response.data.first_name + " " + response.data.last_name
                );
                setUser(response.data);
            })
            .catch((error) => {
                console.log("** Error in UserDetail **\n", error.message);
            });
    };

    useEffect(() => {
        axios_fetchUserFrom(`${SERVER_URL}/user2/${userId}`);
    }, [userId, photoIsUploaded]);
    const handleSeeMoreClick = () => {
        if (user) {
            navigate(`/photos/${user._id}`);
        }
    };

    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach((file) => {
            setSelectedImages((prevState) => [...prevState, file]);
        });
    }, []);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject
    } = useDropzone({ onDrop });

    const style = useMemo(() => ({
        ...(isDragAccept ? { borderColor: "#00e676" } : {}),
        ...(isDragReject ? { borderColor: "#ff1744" } : {})
    }), [isDragAccept, isDragReject]);

    const handleUpload = async () => {
        setUploadStatus("Uploading...");
        const formData = new FormData();
        selectedImages.forEach((image) => {
            console.log('image value', image);
            formData.append("pimage", image);
        });
        try {
            const response = await axios.post(`${SERVER_URL}/photos/new`, formData);
            if (response.status === 200) {
                setUploadStatus("Upload successful");
                setPhotoIsUploaded(true);
                setModalIsOpen(false); // Close modal after successful upload
            }
        } catch (error) {
            console.log("Error: photo upload error ", error);
            setUploadStatus("Upload failed");
        }
        setSelectedImages([])
    };

    if (!props.loginUser || !user) {
        navigate("/login-register");
        return null;
    }

    return (
        user && (
            <Grid container>
                <Grid item xs={12} style={{ textAlign: "center", marginTop: "0px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '10px', marginTop: '-60px' }}>
                <Avatar
                    onClick={() => setModalIsOpen(true)}
                    style={{
                        width: "100px",
                        height: "100px",
                        border: "5px solid white",
                        cursor: "pointer"
                    }}
                />
                {user && user.mostRecentPhotoName && (
                    <CardActionArea
                        to={`/photos/${user._id}`}
                        component={Link}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            overflow: 'hidden'
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={`${SERVER_URL}/images/${user.mostRecentPhotoName}`}
                            alt="photo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </CardActionArea>
                )}
            </div>
        </div>
                    <Typography variant="h5" gutterBottom>{`${user.first_name} ${user.last_name}`}</Typography>
                    <Typography variant="h8" color="textSecondary" gutterBottom>{`${user.email}`}</Typography>
                </Grid>
                {user._id === props.loginUser.id && (
                    <Grid item style={{ margin: "20px auto" }}>
                        <Button
                            size="large"
                            variant="contained"
                            style={{ backgroundColor: "black", color: "white" }}
                            onClick={() => setModalIsOpen(true)}
                        >
                            Upload Photo
                        </Button>
                    </Grid>
                )}
                {user.mostRecentPhotoName && (
                    <Grid
                        item
                        xs={12}
                        style={{ display: "flex", margin: "20px auto", justifyContent: 'center' }}
                    >
                        <Card style={{ maxWidth: 250, margin: "0 20px" }}>
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    Recently Uploaded
                                </Typography>
                            </CardContent>
                            <CardActionArea
                                to={user && `/photos/${user._id}`}
                                component={Link}
                            >
                                <CardMedia
                                    component="img"
                                    image={`${SERVER_URL}/images/${user.mostRecentPhotoName}`}
                                    alt="photo"
                                />
                            </CardActionArea>
                            <CardContent>
                                <Typography variant="body2">
                                    {`${user.mostRecentPhotoDate}`}
                                </Typography>
                            </CardContent>
                        </Card>
                        
                        <Card style={{ maxWidth: 250, margin: "0 20px" }}>
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    Most Likes 
                                </Typography>
                            </CardContent>
                            <CardActionArea
                                to={user && `/photos/${user._id}`}
                                component={Link}
                            >
                                <CardMedia
                                    component="img"
                                    image={`${SERVER_URL}/images/${user.mostLikedPhotoName}`}
                                    alt="photo"
                                />
                            </CardActionArea>
                            <CardContent>
                                <Typography variant="body2">
                                    {`${user.likesCount} Like${user.likesCount >= 2 ? "s" : ""}`}
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card style={{ maxWidth: 250, margin: "0 20px" }}>
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    Most Commented
                                </Typography>
                            </CardContent>
                            <CardActionArea
                                to={user && `/photos/${user._id}`}
                                component={Link}
                            >
                                <CardMedia
                                    component="img"
                                    image={`${SERVER_URL}/images/${user.mostCommentedPhotoName}`}
                                    alt="photo"
                                />
                            </CardActionArea>
                            <CardContent>
                                <Typography variant="body2">
                                    {`${user.commentsCount} Comment${user.commentsCount >= 2 ? "s" : ""}`}
                                </Typography>
                            </CardContent>
                        </Card>

                    </Grid>
                )}
                {user.mostRecentPhotoName && (
                    <Grid item style={{ margin: "20px auto" }}>
                        <span
                            style={{
                                color: "#0063da",
                                cursor: "pointer",
                                textDecoration: "none",
                                transition: "text-decoration 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                            onClick={handleSeeMoreClick}
                        >
                            Photos
                        </span>
                    </Grid>
                )}
                <Modal
                    isOpen={modalIsOpen}
                    onRequestClose={() => setModalIsOpen(false)}
                    contentLabel="Image Upload Modal"
                    style={{
                        content: {
                            top: '50%',
                            left: '61%',
                            right: 'auto',
                            bottom: 'auto',
                            marginRight: '-50%',
                            transform: 'translate(-50%, -50%)',
                            width: '500px',
                            padding: '20px',
                        }
                    }}
                >
                    <h2>Upload Image</h2>
                    <div {...getRootProps({ style: { border: '2px dashed #0063da', padding: '20px', textAlign: 'center' } })}>
                        <input {...getInputProps()} />
                        {isDragActive ? (
                            <p>Drop file(s) here ...</p>
                        ) : (
                            <p>Drag and drop file(s) here, or click to select files</p>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        {selectedImages.length > 0 && selectedImages.map((image, index) => (
                            <img src={URL.createObjectURL(image)} key={index} alt="" style={{ maxWidth: '100%', margin: '10px' }} />
                        ))}
                    </div>
                    {selectedImages.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleUpload}
                            >
                                Upload to Server
                            </Button>
                            <p>{uploadStatus}</p>
                        </div>
                    )}
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSelectedImages([])
                            setModalIsOpen(false)
                        }}
                        style={{ marginTop: '20px' }}
                    >
                        Close
                    </Button>
                </Modal>
            </Grid>
        )
    );
}

export default UserDetail;
