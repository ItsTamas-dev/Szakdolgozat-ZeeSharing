import { Component, OnInit, inject } from '@angular/core';
import { Storage, ref, getDownloadURL, uploadBytesResumable } from '@angular/fire/storage';
import { Firestore, collection, doc, setDoc, getDocs } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../user.service';
import * as mm from 'music-metadata';
import { encode } from 'base64-arraybuffer';
@Component({
  selector: 'app-upload-music',
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-music.component.html',
  styleUrl: './upload-music.component.css'
})
export class UploadMusicComponent implements OnInit {
  constructor(private firestore: Firestore, private userService: UserService) { }
  userData: any = null;
  selectedFile: File | null = null;
  selectedImg: File | null = null;
  downloadURL: string | null = null;
  storage = inject(Storage);
  title: string = '';
  imgUrl: string | null = null;
  db: string = '';
  strg: string = '';
  availableTags: string[] = [];
  selectedTags: string[] = [];
  uploadProgress: number = 0;
  imageUploadProgress: number = 0;
  async ngOnInit() {
    await this.fetchTags();
    this.userData = this.userService.getUserData();
    this.db = this.userData["type"] == "podcast" ? "Podcasts" : "Musics";
    this.strg = this.userData["type"] == "podcast" ? "podcast" : "music";
  }
  async fetchTags() {
    const tagsCollection = collection(this.firestore, 'Tags');
    const querySnapshot = await getDocs(tagsCollection);
    this.availableTags = querySnapshot.docs.map(docSnapshot => docSnapshot.data()['tag']);
  }
  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
  }
  async onFileUpload(event: Event) {
    event.preventDefault();
    this.selectedTags = [];
    if (this.selectedFile) {
      let filePath = `${this.strg}/${Date.now()}_${this.title}`;
      let imgPath = `image/${Date.now()}_${this.title}`;
      const audioStorage = ref(this.storage, filePath);
      try {
        if (this.selectedImg) {
          const imgStorage = ref(this.storage, imgPath);
          const uploadImage = uploadBytesResumable(imgStorage, this.selectedImg);
          uploadImage.on('state_changed', snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.imageUploadProgress = Math.round(progress);
          });
          await new Promise<void>((resolve, reject) => {
            uploadImage.on('state_changed', null, reject, async () => {
              this.imgUrl = await getDownloadURL(uploadImage.snapshot.ref);
              resolve();
            });
          });
        } else {
          this.imgUrl = await this.extractImageFromMp3(this.selectedFile);
        }
        const uploadTask = uploadBytesResumable(audioStorage, this.selectedFile);
        uploadTask.on('state_changed', snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress = Math.round(progress);
        });
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', null, reject, async () => {
            this.downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          });
        });
        const docRef = doc(this.firestore, this.db, this.selectedFile.name);
        await setDoc(docRef, {
          audio: this.downloadURL,
          name: this.title,
          tags: this.selectedTags,
          img: this.imgUrl,
          uploadDate: new Date(),
          performer: this.userData.username
        });
      } catch (error) {
      }
    }
  }
  async extractImageFromMp3(file: File): Promise<string | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const metadata = await mm.parseBuffer(uint8Array, 'audio/mpeg');
      const picture = metadata.common.picture && metadata.common.picture[0];
      if (picture) {
        const base64String = encode(picture.data);
        const imageUrl = `data:${picture.format};base64,${base64String}`;
        return await this.uploadImage(imageUrl);
      }
      return "https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e";
    } catch (error) {
      return null;
    }
  }
  async uploadImage(imageData: string): Promise<string> {
    const imagePath = `image/${Date.now()}_${this.title}`;
    const imageRef = ref(this.storage, imagePath);
    const response = await fetch(imageData);
    const blob = await response.blob();
    const uploadTask = uploadBytesResumable(imageRef, blob);
    uploadTask.on('state_changed', snapshot => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      this.imageUploadProgress = Math.round(progress);
    });
    return new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, async () => {
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(imageUrl);
      });
    });
  }
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && file.type === 'audio/mpeg') {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
    }
  }
  onImgSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      this.selectedImg = file;
    } else {
      this.selectedImg = null;
    }
  }
}