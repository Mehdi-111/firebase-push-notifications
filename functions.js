const functions = require('firebase-functions');
const fetch = require('node-fetch');
var admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);




exports.recievedMessageNotification = functions.firestore
    .document('/messages/{docId}/chats/{msgId}')
    .onWrite((change, context) => {


        return admin.firestore().collection('messages').doc(context.params.docId).collection('chats').doc(context.params.msgId).get().then(snap => {
            let senderId = snap.data().user.uid
            let chatId = context.params.docId.split('_')
            let notifId = chatId[0] === senderId ? chatId[1] : chatId[0]

            return admin.database().ref('/users/' + notifId).once('value', async snapshot => {
                let user = snapshot.val();
                let userToken = user.token
                if (userToken) {

                    const message = {
                        to: userToken,
                        sound: 'default',
                        title: 'New message!',
                        body: 'You have a new message on appName ! ',
                        data: { data: 'newMessage' },
                        _displayInForeground: true,
                    };


                    try {
                        return fetch('https://exp.host/--/api/v2/push/send', {
                            method: 'POST',
                            headers: {
                                Accept: 'application/json',
                                'Accept-encoding': 'gzip, deflate',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(message),
                        });
                    }
                    catch (err) {
                        console.log(err)
                    }
                }




            }).then(() => {
                console.log("sent")
                return;


            }).catch(err => console.log(err))







        }).catch(err => console.log(err))








    });
exports.sharedPostNotif = functions.firestore
    .document('/posts/{docId}')
    .onCreate((change, context) => {
        var subscribers = []

        admin.firestore().collection("posts").doc(context.params.docId).get().then(user => {
            let userId = user.data().user

            return admin.firestore().collection("users").where("uid", "==", userId).get().then(doc => {
                return doc.docs.forEach(user => {


                    admin.firestore().collection("users").doc(user.id).collection("subscribers").get().then(docs => {
                        return docs.docs.forEach(subs => {

                            admin.database().ref("users/" + subs.data().id).once("value", async snapshot => {
                                if (snapshot.val()) {
                                    let token = snapshot.val().token
                                    if (token) {

                                        const message = {
                                            to: token,
                                            sound: 'default',
                                            title: 'appName',
                                            body: 'New Post from your subscribers !!!',
                                            data: { data: 'New Post from your subscribers !!!' },
                                            _displayInForeground: true,
                                        };


                                        try {
                                            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                                                method: 'POST',
                                                headers: {
                                                    Accept: 'application/json',
                                                    'Accept-encoding': 'gzip, deflate',
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify(message),
                                            });

                                            return response

                                        }
                                        catch (err) {
                                            console.log(err)
                                        }
                                    }
                                }
                            }).catch((err) => {
                                console.log(err)
                                return;
                            })


                        })
                    }).catch(err => console.log(err))



                    let friends = user.data().friends;
                    if (!friends) {
                        return;
                    }

                    friends.map(user => {
                        admin.database().ref("users/" + user).once("value", async snapshot => {
                            if (snapshot.val()) {
                                let token = snapshot.val().token
                                if (token) {

                                    const message = {
                                        to: token,
                                        sound: 'default',
                                        title: 'appName',
                                        body: 'New Post from your subscribers',
                                        data: { data: 'New Post from your subscribers' },
                                        _displayInForeground: true,
                                    };


                                    try {
                                        const response = await fetch('https://exp.host/--/api/v2/push/send', {
                                            method: 'POST',
                                            headers: {
                                                Accept: 'application/json',
                                                'Accept-encoding': 'gzip, deflate',
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify(message),
                                        });

                                        return response

                                    }
                                    catch (err) {
                                        console.log(err)
                                    }
                                }
                            }
                        }).catch((err) => {
                            console.log(err)
                            return;
                        })
                    })
                })

            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    })



exports.recievedfriendRequest = functions.database
    .ref('/friendsRequests/{concatId}')
    .onWrite((change, context) => {

        let concatId = context.params.concatId;

        let senderId = change.after.val().sender
        let status = change.after.val().status
        let users = concatId.split("_")

        if (status === "Accepted" || status === "Refused") {
            return;
        }
        let userId = senderId === users[0] ? users[1] : users[0]

        admin.database().ref("users/" + userId).once("value", async (snapshot) => {
            if (snapshot.val()) {

                let token = snapshot.val().token
                console.log(token)
                if (token) {

                    const message = {
                        to: token,
                        sound: 'default',
                        title: 'appName',
                        body: 'New friend request',
                        data: { data: 'New friend request' },
                        _displayInForeground: true,
                    };


                    try {
                        const response = await fetch('https://exp.host/--/api/v2/push/send', {
                            method: 'POST',
                            headers: {
                                Accept: 'application/json',
                                'Accept-encoding': 'gzip, deflate',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(message),
                        });

                        return response

                    }
                    catch (err) {
                        console.log(err)
                    }
                }
            }
        }).catch((err) => console.log(err))
    })

exports.onLikedPost = functions.firestore
    .document('/posts/{docId}/likedUsers/{liker}')
    .onCreate((change, context) => {

        admin.firestore().collection("posts").doc(context.params.docId).get().then(user => {
            let userId = user.data().user
            console.log(userId)
            return admin.database().ref("users/" + userId).once("value", async (snapshot) => {
                if (snapshot.val()) {
                    let token = snapshot.val().token
                    if (token) {

                        const message = {
                            to: token,
                            sound: 'default',
                            title: 'appName',
                            body: 'A person liked your post, go check !',
                            data: { data: 'A person liked your post, go check !' },
                            _displayInForeground: true,
                        };


                        try {
                            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                                method: 'POST',
                                headers: {
                                    Accept: 'application/json',
                                    'Accept-encoding': 'gzip, deflate',
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(message),
                            });

                            return response

                        }
                        catch (err) {
                            console.log(err)
                        }
                    }
                }
            }).catch((err) => console.log(err))
        }).catch((err) => console.log(err))
    })

exports.onSubscribtion = functions.firestore
    .document('/users/{docId}/subscribers/{subscriber}')
    .onCreate((change, context) => {

        admin.firestore().collection("users").doc(context.params.docId).get().then(user => {
            let userId = user.data().uid
            return admin.database().ref("users/" + userId).once("value", async (snapshot) => {
                if (snapshot.val()) {
                    let token = snapshot.val().token
                    if (token) {

                        const message = {
                            to: token,
                            sound: 'default',
                            title: 'appName',
                            body: 'You have a new subscriber',
                            data: { data: 'You have a new subscriber' },
                            _displayInForeground: true,
                        };


                        try {
                            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                                method: 'POST',
                                headers: {
                                    Accept: 'application/json',
                                    'Accept-encoding': 'gzip, deflate',
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(message),
                            });

                            return response

                        }
                        catch (err) {
                            console.log(err)
                        }
                    }
                }
            }).catch((err) => console.log(err))
        }).catch((err) => console.log(err))
    })

exports.onReportedPost = functions.database
    .ref('/reports/{concatId}')
    .onCreate((change, context) => {
        let token = "Admin's token"
        const message = {
            to: token,
            sound: 'default',
            title: 'appName',
            body: 'someone has reported a post, go check !',
            data: { data: 'someone has reported a post, go check !' },
            _displayInForeground: true,
        };


        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            return response

        }
        catch (err) {
            console.log(err)
        }
    })
