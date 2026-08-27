import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user.service';
import { Firestore, collection, query, where, getDocs, doc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-create-play-list',
  imports: [FormsModule],
  templateUrl: './create-play-list.component.html',
  styleUrl: './create-play-list.component.css'
})
export class CreatePlayListComponent implements OnInit {
  userData: any = null;
  playlistName: string = '';
  playlistType: string = '';
  errorMessage: string = '';
  constructor(private userService: UserService, private firestore: Firestore) { }
  ngOnInit(): void {
    this.userData = this.userService.getUserData();
  }
  async newPlayList() {
    if (!this.userData || !this.playlistName || !this.playlistType) {
      return;
    }
    const playlistsCollection = collection(this.firestore, 'PlayLists');
    const playlistsQuery = query(
      playlistsCollection,
      where('user', '==', this.userData["username"]),
      where('title', '==', this.playlistName)
    );
    const querySnapshot = await getDocs(playlistsQuery);
    if (!querySnapshot.empty) {
      return;
    }
    const newPlaylistRef = doc(this.firestore, 'PlayLists', `${this.userData["username"]}_${this.playlistName}`);
    await setDoc(newPlaylistRef, {
      user: this.userData["username"],
      title: this.playlistName,
      type: this.playlistType,
      createdAt: new Date(),
      songs: []
    });
    this.errorMessage = '';
    alert('Playlist created successfully!');
    this.playlistName = '';
    this.playlistType = '';
  }
}
