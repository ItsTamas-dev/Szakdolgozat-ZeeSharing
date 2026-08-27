import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user.service';
import { Firestore, collection, query, where, getDocs, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faArrowDown, faArrowUp, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { EventEmitter, Input, Output } from '@angular/core';
export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-play-lists',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './play-lists.component.html',
  styleUrl: './play-lists.component.css'
})
export class PlayListsComponent implements OnInit {
  userData: any = null;
  userPlaylists: { title: string; type: string, songs: Zene[], showMusics: boolean }[] = [];
  followedFlists: { title: string; type: string; songs: Zene[]; owner: string, showMusics: boolean }[] = [];
  faEye = faEye;
  faArrowDown = faArrowDown;
  faArrowUp = faArrowUp;
  faTrashCan = faTrashCan;
  @Input() latestSongs: Zene[] = [];
  @Output() songClicked = new EventEmitter<{
    songs: {
      name: string;
      audio: string;
      performer: string;
      img?: string;
      tags?: string[];
    }[]; index: number
  }>();
  constructor(
    private userService: UserService,
    private firestore: Firestore
  ) { }
  ngOnInit(): void {
    this.userData = this.userService.getUserData();
    if (this.userData) {
      this.loadUserPlaylists();
      this.loadFollowedPlaylists();
    }
  }
  async loadUserPlaylists() {
    const playlistsCollection = collection(this.firestore, 'PlayLists');
    const playlistsQuery = query(playlistsCollection, where('user', '==', this.userData['username']));

    const querySnapshot = await getDocs(playlistsQuery);
    this.userPlaylists = querySnapshot.docs.map(docSnapshot => ({
      title: docSnapshot.data()['title'],
      type: docSnapshot.data()['type'],
      songs: docSnapshot.data()['songs'],
      showMusics: false
    }));
  }
  toggleMusicVisibility(title: string) {
    const playlist = this.userPlaylists.find(list => list.title === title);
    if (playlist) {
      playlist.showMusics = !playlist.showMusics;
    }
  }
  async onSongSelected(lista: string, i: number) {
    const playlist = this.userPlaylists.find((list) => list.title === lista);
    if (playlist) {
      this.songClicked.emit({
        songs: playlist.songs,
        index: i,
      });
    }
  }
  async deleteFromPlayList(title: string, song: Zene) {
    if (!this.userData?.email) return;
    try {
      const playlistsCollection = collection(this.firestore, 'PlayLists');
      const playlistsQuery = query(
        playlistsCollection,
        where('user', '==', this.userData['username']),
        where('title', '==', title)
      );
      const querySnapshot = await getDocs(playlistsQuery);

      if (!querySnapshot.empty) {
        const playlistDoc = querySnapshot.docs[0];
        const playlistRef = playlistDoc.ref;
        const playlistData = playlistDoc.data();
        const updatedSongs = (playlistData['songs'] || []).filter(
          (s: Zene) => s.audio !== song.audio
        );
        await updateDoc(playlistRef, {
          songs: updatedSongs
        });
        const playlistIndex = this.userPlaylists.findIndex(p => p.title === title);
        if (playlistIndex !== -1) {
          this.userPlaylists[playlistIndex].songs = updatedSongs;
        }
      }
    } catch (error) {
    }
  }
  refresh() {
    if (this.userData) {
      this.loadUserPlaylists();
    }
  }
  async toggleListVisibility(title: string) {
    const playlistIndex = this.userPlaylists.findIndex(p => p.title === title);
    if (playlistIndex === -1) return;
    const playlist = this.userPlaylists[playlistIndex];
    const currentType = playlist.type;
    const nextType = currentType === 'public' ? 'friend'
      : currentType === 'friend' ? 'private'
        : 'public';
    try {
      const playlistsCollection = collection(this.firestore, 'PlayLists');
      const playlistsQuery = query(
        playlistsCollection,
        where('user', '==', this.userData.username),
        where('title', '==', title)
      );
      const querySnapshot = await getDocs(playlistsQuery);
      if (!querySnapshot.empty) {
        const playlistDoc = querySnapshot.docs[0];
        const playlistRef = playlistDoc.ref;
        await updateDoc(playlistRef, { type: nextType });
        this.userPlaylists[playlistIndex].type = nextType;
      }
    } catch (error) {
    }
  }
  async loadFollowedPlaylists() {
    const followedPlaylists: { title: string; owner: string }[] = [];
    try {
      const followListRef = collection(this.firestore, 'FollowLists');
      const followQuery = query(
        followListRef,
        where('User1', '==', this.userData["username"])
      );
      const followSnapshot = await getDocs(followQuery);
      followSnapshot.forEach(doc => {
        const data = doc.data();
        followedPlaylists.push({
          title: data['Lista'],
          owner: data['User2'],
        });
      });
      const results: { title: string; type: string; songs: Zene[]; owner: string }[] = [];
      for (const { title, owner } of followedPlaylists) {
        const playlistsRef = collection(this.firestore, 'PlayLists');
        const playlistQuery = query(
          playlistsRef,
          where('user', '==', owner),
          where('title', '==', title)
        );
        const playlistSnapshot = await getDocs(playlistQuery);
        if (!playlistSnapshot.empty) {
          const playlistDoc = playlistSnapshot.docs[0];
          const data = playlistDoc.data();
          this.followedFlists.push({
            title: data['title'],
            type: data['type'],
            songs: data['songs'],
            owner: owner,
            showMusics: false
          });
        }
      }
    } catch (err) {
    }
  }
  toggleFollowedVisibility(title: string) {
    const playlist = this.followedFlists.find(list => list.title === title);
    if (playlist) {
      playlist.showMusics = !playlist.showMusics;
    }
  }
  async deleteFollowList(list: { title: string; type: string; songs: Zene[]; owner: string; showMusics: boolean }) {
    try {
      const followListRef = collection(this.firestore, 'FollowLists');
      const followQuery = query(
        followListRef,
        where('User1', '==', this.userData["username"]),
        where('User2', '==', list.owner),
        where('Lista', '==', list.title)
      );
      const snapshot = await getDocs(followQuery);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await deleteDoc(docRef);

        this.followedFlists = this.followedFlists.filter(p =>
          !(p.title === list.title && p.owner === list.owner)
        );
      }
    } catch (error) {
    }
  }
}
