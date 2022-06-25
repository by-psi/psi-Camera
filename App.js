import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, StatusBar, SafeAreaView, Modal, View, Text, TextInput, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { shareAsync } from 'expo-sharing';
import { format } from 'date-fns';

import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

import { FontAwesome, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

export default function App() {
  const camRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState('off');
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(true);
  const [photo, setCapturedPhoto] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    (async ()=>{
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  if(hasCameraPermission === null){
    return <View/>
  }
  if(hasCameraPermission === false){
    return <Text> Acesso Negado! </Text>
  }

  function FlipCam(){
    setType(
      type === Camera.Constants.Type.back
      ? Camera.Constants.Type.front
      : Camera.Constants.Type.back
    );
  }

  function FlashMode() {
    if (flash === 'on') {
      setFlash('off');
    } else if (flash === 'off') {
      setFlash('on');
    } else {
      setFlash('auto');
    }
  }

  async function takePicture(){
    const options = { quality: 1, base64: true, exif: false }
    if (camRef){
      const data = await camRef.current.takePictureAsync(options);
      setCapturedPhoto(data);
      // console.log('Imagem capturada: '+data.base64);
      console.log('Imagem capturada: '+data.uri);
      setShow(true); 
    }
  }

  async function OpenAlbum() {
    const options = { quality: 1, base64: true, exif: false }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permissão necessária para acessar o Álbum de Fotos!");
      return;
    }
    const data = await ImagePicker.launchImageLibraryAsync(options);
    setCapturedPhoto(data);
    // console.log('Imagem recuperada do Álbum de Fotos: '+data.base64);
    console.log('Imagem recuperada do Álbum de Fotos: '+data.uri);
    setShow(true); 
  }

  function SharePicture(){
    shareAsync(photo.uri).then(()=>{
      setCapturedPhoto(undefined);
    });
  };

  async function SavePhoto(){
    setLoading(true);
    await MediaLibrary.saveToLibraryAsync(photo.uri).then(()=>{
      setCapturedPhoto(undefined);     
      const post = {
        "postId": 1,
        "postDescription": descricao,
        "postDate": format(new Date(), 'dd/MM/yyyy'),
        "postHour": new Date().getTime(),
        "postLikes": 0,
        "userAvatar": photo.uri,
        "userName": "Ezequias Martins",
        "postComments": 0,
        "postLiked": false,
        "postImage": photo.base64
      };
      console.log('Post a ser enviado: '+ JSON.stringify(post));
      setLoading(false);
    });
  };

  function fechar(){
    alert('fechar...');
  }

  if (loading) {
    return(
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          opacity: 0.5,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ActivityIndicator
          size={75}
          color='#F1C40F'
        />
        <Text style={{color: '#FFF'}}>Aguarde, processando...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>PREVIEW DA IMAGEM</Text>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity onPress={FlashMode} style={styles.btnFlash}>
            <FontAwesome name="flash" size={32} color={flash === "on" ? "#FFCC00" : "#000"}/>
          </TouchableOpacity>
          <TouchableOpacity onPress={FlipCam} style={styles.btnFlip}>
            <MaterialCommunityIcons name={type === Camera.Constants.Type.back ? "camera-rear" : "camera-front-variant"} size={32} color="#000"/>
          </TouchableOpacity>
        </View>       
      </View>

      <Camera style={styles.preview} flashMode={flash} type={type} ref={camRef}>
        <View style={styles.imgPreview} />
        <StatusBar hidden={false} backgroundColor="#000" />
      </Camera>     

      <View style={styles.btnAreaI}>
        <TouchableOpacity style={styles.btnAlbum} onPress={ OpenAlbum }>
          <MaterialCommunityIcons name='folder-multiple-image' size={32} color={'#000'}/>
          <Text style={{color: '#000'}}>Album</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCapture} onPress={ takePicture }>
            <Feather name='circle' size={100} color={'#000'}/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnClose} onPress={ fechar }>
          <MaterialCommunityIcons name='arrow-u-left-top-bold' size={32} color={'#000'}/>
          <Text style={{color: '#000'}}>Back</Text>
        </TouchableOpacity>
      </View>

      { photo &&
        <Modal animationType='slide' transparent={false} visible={show}>

          <View style={styles.header}>
            <Text style={styles.title}>IMAGEM CAPTURADA</Text>
            <TouchableOpacity onPress={()=> setShow(false)}>
              <FontAwesome name="window-close" size={50} color="#000" />
            </TouchableOpacity>
          </View>
  
          <View style={styles.modal}>
            <Image 
            style={styles.imgModal} 
            source={{ uri: `data:image/jpg;base64,${photo.base64}`}} 
            // source={{ uri: photo }} 
            />
          </View>

          <View style={styles.inputArea}>
            <Text style={styles.label}>Descrição:</Text>
            <TextInput 
              style={styles.input} 
              placeholder='Descrição...'
              placeholderTextColor={'#BDBDBD'}
              underlineColorAndroid='transparent'
              keyboardType='default'
              returnKeyType='next'
              onSubmitEditing={() => Keyboard.dismiss()}
              value={descricao}
              onChangeText={(input) => setDescricao(input)}
            /> 
          </View>

          <View style={styles.btnAreaII}>
              <TouchableOpacity 
                style={styles.btnDiscard}
                onPress={() => setCapturedPhoto(null)}
              >
                <MaterialCommunityIcons name='delete-forever' size={42} color={'#000'}/>
                <Text style={{color: '#000'}}>Descartar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnShare} onPress={SharePicture}>
                <MaterialCommunityIcons name='share-variant' size={42} color={'#000'}/>
                <Text style={{color: '#000'}}>Compartilhar</Text>
              </TouchableOpacity>

              { hasMediaLibraryPermission ?
                <TouchableOpacity style={styles.btnSave} onPress={SavePhoto}>
                  <MaterialCommunityIcons name='image-move' size={42} color={'#000'}/>
                  <Text style={{color: '#000'}}> Postar Foto...</Text>
                </TouchableOpacity>
                : undefined 
              }
            </View>  

        </Modal>
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center',
    margin: 10
  },
  header:{ 
    flex: 0.2, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    margin: 10,
  },
  title:{ 
    color: '#0033CC',  
    fontSize: 21, 
    fontWeight: 'bold' 
  },
  preview:{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  imgPreview:{
    flex: 1, 
    backgroundColor: 'transparent', 
    flexDirection: 'row',    
  },
  btnAreaI:{
    flex: 0.2, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    margin: 10
  }, 
  btnAreaII: {
    flex: 0.2, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 10,
  }, 
  btnAlbum:{
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'transparent', 
    height: 50, 
    width: 50, 
    marginBottom: 10
  },
  btnCapture:{
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'transparent', 
    height: 100, 
    width: 100, 
    marginBottom: 10
  },
  btnClose:{
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'transparent', 
    height: 50, 
    width: 50, 
    marginBottom: 10
  },
  btnFlash:{
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'transparent', 
    height: 50, 
    width: 50, 
    marginBottom: 10
  },
  btnFlip:{
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'transparent', 
    height: 50, 
    width: 50, 
    marginBottom: 10
  },
  btnDiscard:{
    flex: 1, 
    width: '30%', 
    marginEnd: 10, 
    height: 80, 
    backgroundColor: 'transparent', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  btnShare:{
    flex: 1, 
    width: '30%', 
    height: 80, 
    backgroundColor: 'transparent', 
    borderRadius: 5, 
    justifyContent: 'center', 
    alignItems: 'center'    
  },
  btnSave:{
    flex: 1, 
    width: '30%', 
    marginEnd: 10, 
    height: 80, 
    backgroundColor: 'transparent', 
    borderRadius: 5, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  modal:{
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10
  },
  imgModal:{
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 10
  },
  inputArea:{
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 30,
    marginLeft: 10,
  },
  label:{
    fontSize: 18, 
    color: '#000', 
    fontStyle: 'italic', 
    fontWeight: 'bold', 
    marginBottom: 10
  },
  input:{
    height: 55,
    padding: 10, 
    backgroundColor: '#FFFFCC',
    borderRadius: 10,
    width: '98%',
    fontSize: 18,
    borderWidth: 1, 
    borderColor: '#0033CC', 
    borderRadius: 5, 
  },

});
