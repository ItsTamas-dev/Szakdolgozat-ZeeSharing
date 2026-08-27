import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faDownload, faSignOut, faUpload, faTv, faPlus, faX, faMusic, faList,
  faUser, faPlay, faPause, faBackward, faForward, faRandom, faRotateBack,
  faVolumeHigh, faVolumeXmark, faVolumeLow, faCheckCircle, faXmarkCircle,
  faSearch, faFileDownload, faComment, faCircle, faUserFriends, faClock,
  faArrowUp, faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { Firestore, collection, getDocs, doc, setDoc, addDoc, query, where } from '@angular/fire/firestore';
import { UserService } from '../../user.service';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { LatestMusicComponent } from '../latest-music/latest-music.component';
import { PopularMusicComponent } from '../popular-music/popular-music.component';
import { RecommendedMusicComponent } from '../recommended-music/recommended-music.component';
import { CreatePlayListComponent } from '../create-play-list/create-play-list.component';
import { PlayListsComponent } from '../play-lists/play-lists.component';
import { UploadMusicComponent } from '../upload-music/upload-music.component';
import { SearchComponent } from '../search/search.component';
import { FriendsComponent } from '../friends/friends.component';
import { ChatComponent } from '../chat/chat.component';
import { ForumComponent } from '../forum/forum.component';
import { UserComponent } from '../user/user.component';
import { LatestPodcastComponent } from '../latest-podcast/latest-podcast.component';
import { AdminComponent } from '../admin/admin.component';
import { PlaylistService } from './playListService';
import { ChatService } from '../chat/chatService';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-main',
  imports: [CommonModule, FontAwesomeModule, FormsModule,
    LatestMusicComponent, PopularMusicComponent, RecommendedMusicComponent,
    CreatePlayListComponent, PlayListsComponent, UploadMusicComponent, SearchComponent,
    FriendsComponent, ChatComponent, ForumComponent, UserComponent, LatestPodcastComponent, AdminComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnInit, OnDestroy {
  @ViewChild(PlayListsComponent) playListsComponent!: PlayListsComponent;
  private messagesSub!: Subscription;
  constructor(private firestore: Firestore, private auth: Auth, private router: Router, private userService: UserService, private playlistService: PlaylistService,
    private chatService: ChatService, private cdRef: ChangeDetectorRef) { }
  userData: any = null;
  private userSub!: Subscription;
  isUnread: boolean = false;
  admin: boolean = false;
  ngOnInit(): void {
    this.userSub = this.userService.userData$.subscribe(data => {
      this.userData = data;
    });
    this.userData = this.userService.getUserData();
    this.admin = this.isAdmin();
    this.chatService.listenForMessagesAll(this.userData['username']);
    this.messagesSub = this.chatService.unreadMessages$.subscribe(messages => {
      if (messages.length > 0) {
        this.isUnread = true;
        this.cdRef.detectChanges();
      } else {
        this.isUnread = false;
        this.cdRef.detectChanges();
      }
    });
  }
  isAdmin() {
    return this.userData["type"] == "admin";
  }
  ngOnDestroy(): void {
    this.messagesSub?.unsubscribe();
    this.userSub.unsubscribe();
  }
  faPlay = faPlay;
  faPause = faPause;
  faBackward = faBackward;
  faForward = faForward;
  faRandom = faRandom;
  faRotateBack = faRotateBack;
  faVolumeHigh = faVolumeHigh;
  faVolumeXmark = faVolumeXmark;
  faVolumeLow = faVolumeLow;
  faMusic = faMusic;
  faList = faList;
  faUser = faUser;
  faPlus = faPlus;
  faX = faX;
  faUpload = faUpload;
  faTv = faTv;
  faSignOut = faSignOut;
  faDownload = faDownload;
  faCheckCircle = faCheckCircle;
  faXmarkCircle = faXmarkCircle;
  faSearch = faSearch;
  faFileDownload = faFileDownload;
  faComment = faComment;
  faCircle = faCircle;
  faUserFriends = faUserFriends;
  faClock = faClock;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  songsByPerformer: Zene[] = [];
  currentMusic: Zene | null = null;
  currentIndex: number = -1;
  audioPlayer: HTMLAudioElement | null = null;
  volume: number = 1;
  revolume: number = 1;
  audioDuration: number = 0;
  audioCurrentTime: number = 0;
  isPlaying: boolean = false;
  isRandom: boolean = false;
  isReplay: number = 0;
  handleSongClicked(event: { songs: Zene[]; index: number }) {
    this.songsByPerformer = event.songs;
    if (this.songsByPerformer.length > 0) {
      this.playMusic(event.index)
    }
  }
  playMusic(toindex: number) {
    this.currentIndex = toindex;
    this.currentMusic = this.songsByPerformer[this.currentIndex];
    if (!this.audioPlayer) {
      this.audioPlayer = document.createElement('audio');
      document.body.appendChild(this.audioPlayer);
    }
    this.audioPlayer.src = this.songsByPerformer[this.currentIndex].audio;
    this.audioPlayer.play();
    this.isPlaying = true;
    this.audioPlayer.onloadedmetadata = () => {
      this.audioDuration = this.audioPlayer?.duration || 0;
      this.audioCurrentTime = 0;
      this.updateCurrentTime();
      this.cdRef.detectChanges();
    };
    const playHistoryCollection = collection(this.firestore, 'PlayHistory');
    addDoc(playHistoryCollection, {
      user: this.userData?.email,
      name: this.currentMusic.name,
      performer: this.currentMusic.performer,
      tags: this.currentMusic.tags || [],
      img: this.currentMusic.img,
      playedAt: new Date(),
    });
  }
  playSongAndContinue(song: Zene) {
    this.currentMusic = song;
    if (!this.audioPlayer) {
      this.audioPlayer = document.createElement('audio');
      document.body.appendChild(this.audioPlayer);
    }
    this.audioPlayer.src = song.audio;
    this.audioPlayer.play();
    this.isPlaying = true;
    this.audioPlayer.onloadedmetadata = () => {
      this.audioDuration = this.audioPlayer?.duration || 0;
      this.audioCurrentTime = 0;
      this.updateCurrentTime();
    };
    const playHistoryCollection = collection(this.firestore, 'PlayHistory');
    addDoc(playHistoryCollection, {
      user: this.userData?.email,
      name: this.currentMusic.name,
      performer: this.currentMusic.performer,
      tags: this.currentMusic.tags || [],
      img: this.currentMusic.img,
      playedAt: new Date(),
    });
    this.audioPlayer.onended = () => {
      this.playNext();
    };
  }
  playNext() {
    if (this.songsByPerformer.length > 0) {
      if (this.isReplay == 1) {
        this.playMusic(this.currentIndex);
        this.isReplay = 0;
      } else if (this.isReplay == 2) {
        this.playMusic(this.currentIndex);
      } else if (this.isRandom) {
        let random = Math.floor(Math.random() * this.songsByPerformer.length);
        while (random == this.currentIndex) {
          random = Math.floor(Math.random() * this.songsByPerformer.length);
        }
        this.currentIndex = random;
        this.playMusic(this.currentIndex);
      } else {
        if (this.currentIndex + 1 >= this.songsByPerformer.length) {
          this.currentIndex = 0;
        } else {
          this.currentIndex += 1;
        }
        this.playMusic(this.currentIndex);
      }
    }
  }
  playPrevious() {
    if (this.songsByPerformer.length > 0) {
      if (this.currentIndex - 1 < 0) {
        this.currentIndex = this.songsByPerformer.length - 1;
      } else {
        this.currentIndex -= 1;
      }
      this.playMusic(this.currentIndex);
    }
  }
  updateCurrentTime() {
    if (this.audioPlayer) {
      const interval = setInterval(() => {
        if (this.audioPlayer) {
          this.audioCurrentTime = this.audioPlayer.currentTime;

          if (this.audioCurrentTime >= this.audioDuration) {
            this.playNext();
            clearInterval(interval);
          }
        }
      }, 1000);
    }
  }
  setVolume() {
    if (this.audioPlayer) {
      this.audioPlayer.volume = this.volume;
    }
  }
  togglePlayPause() {
    if (this.audioPlayer) {
      if (this.isPlaying) {
        this.audioPlayer.pause();
      } else {
        this.audioPlayer.play();
      }
      this.isPlaying = !this.isPlaying;
    }
  }
  toggleVolume() {
    if (this.volume > 0) {
      this.revolume = this.volume;
      this.volume = 0;
    } else {
      this.volume = this.revolume;
    }
    if (this.audioPlayer) {
      this.audioPlayer.volume = this.volume;
    }
  }
  toggleRandom() {
    this.isRandom = !this.isRandom;
    this.isReplay = 0;
  }
  toggleReplay() {
    if (this.isReplay == 0) {
      this.isReplay = 1;
    } else if (this.isReplay == 1) {
      this.isReplay = 2;
    } else {
      this.isReplay = 0;
    }
    this.isRandom = false;
  }
  seekMusic(event: Event) {
    const target = event.target as HTMLInputElement;
    const newTime = Number(target.value);
    if (this.audioPlayer) {
      this.audioPlayer.currentTime = newTime;
    }
  }
  formatTime(time: number) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  async downloadSong(zene: Zene): Promise<void> {
    try {
      if (!zene.name || !zene.audio) {
        console.error("Hiányzó név vagy audio URL:", zene);
        return;
      }

      const audioResponse = await fetch(zene.audio);
      const audioData = await audioResponse.arrayBuffer();
      if (!(audioData instanceof ArrayBuffer)) {
        throw new Error("Audio nem megfelelő formátum.");
      }

      let imageData: ArrayBuffer | null = null;
      if (zene.img) {
        try {
          const imageResponse = await fetch(zene.img);
          imageData = await imageResponse.arrayBuffer();
          if (!(imageData instanceof ArrayBuffer)) {
            console.warn("Kép nem megfelelő formátum, kihagyva.");
            imageData = null;
          }
        } catch (imgError) {
          console.warn("Kép letöltési hiba:", imgError);
          imageData = null;
        }
      }

      const db = await this.openDatabase();
      if (!db.objectStoreNames.contains("songs")) {
        console.error("A 'songs' objectStore nem létezik!");
        return;
      }

      const song = {
        name: zene.name,
        performer: zene.performer || "Ismeretlen",
        fileData: audioData,
        imageData: imageData
      };

      console.log("Mentésre kerülő objektum:", song);

      const transaction = db.transaction("songs", "readwrite");
      const store = transaction.objectStore("songs");
      const request = store.put(song);

      request.onsuccess = () => {
        alert(`${zene.name} - letöltve!`);
      };

      request.onerror = () => {
        console.error("Mentési hiba:", request.error);
      };

    } catch (error) {
      console.error("Hiba a letöltés során:", error);
    }
  }

  openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MusicDatabase", 4);

      request.onupgradeneeded = function (event) {
        const db = (event.target as IDBOpenDBRequest).result;

        if (db.objectStoreNames.contains("songs")) {
          db.deleteObjectStore("songs")
        }
        db.createObjectStore("songs", { keyPath: "name" });
      };

      request.onsuccess = function (event) {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = function () {
        reject("Hiba az IndexedDB megnyitásakor!");
      };
    });
  }


  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
    }
  }
  showCurrentlyPlayList = true;
  showCreatePlaylist = false;
  showUserPlayList = false;
  showUserFriendList = false;
  showList: boolean = true;
  showUpload: boolean = false;
  showSearch: boolean = false;
  showChat: boolean = false;
  showForum: boolean = false;
  showUser: boolean = false;
  showAdmin: boolean = false;
  toggleShowCurrentlyPlaylist() {
    this.showCurrentlyPlayList = true;
    this.showUserFriendList = false;
    this.showUserPlayList = false;
  }
  toggleCreatePlaylist() {
    this.showCreatePlaylist = !this.showCreatePlaylist;
  }
  toggleShowUserFriendList() {
    this.showCurrentlyPlayList = false;
    this.showUserFriendList = true;
    this.showUserPlayList = false;
  }
  toggleShowUserPlayList() {
    this.showCurrentlyPlayList = false;
    this.showUserFriendList = false;
    this.showUserPlayList = true;
  }
  toggleMusicList() {
    this.showUpload = false;
    this.showList = true;
    this.showSearch = false;
    this.showChat = false;
    this.showForum = false;
    this.showUser = false;
    this.showAdmin = false;
  }
  toggleUploadMusic() {
    this.showUpload = true;
    this.showList = false;
    this.showSearch = false;
    this.showChat = false;
    this.showForum = false;
    this.showUser = false;
    this.showAdmin = false;
  }
  toggleSearch() {
    this.showUpload = false;
    this.showList = false;
    this.showSearch = true;
    this.showChat = false;
    this.showForum = false;
    this.showUser = false;
    this.showAdmin = false;
  }
  toggleForum() {
    this.showUpload = false;
    this.showList = false;
    this.showSearch = false;
    this.showChat = false;
    this.showForum = true;
    this.showUser = false;
    this.showAdmin = false;
  }
  toggleUser() {
    this.showUpload = false;
    this.showList = false;
    this.showSearch = false;
    this.showChat = false;
    this.showForum = false;
    this.showUser = true;
    this.showAdmin = false;
  }
  toggleAdmin() {
    this.showUpload = false;
    this.showList = false;
    this.showSearch = false;
    this.showChat = false;
    this.showForum = false;
    this.showUser = false;
    this.showAdmin = true;
  }
  showPlaylistMenu = false;
  userPlaylists: { title: string; type: string, contains: boolean }[] = [];
  togglePlaylistMenu() {
    this.showPlaylistMenu = !this.showPlaylistMenu;
    if (this.showPlaylistMenu) {
      this.loadUserPlaylists();
    }
  }
  async loadUserPlaylists() {
    const playlistsCollection = collection(this.firestore, 'PlayLists');
    const playlistsQuery = query(playlistsCollection, where('user', '==', this.userData?.username));

    const querySnapshot = await getDocs(playlistsQuery);
    this.userPlaylists = querySnapshot.docs.map(docSnapshot => ({
      title: docSnapshot.data()['title'],
      type: docSnapshot.data()['type'],
      contains: (docSnapshot.data()['songs'] || []).some((song: Zene) => song.name === this.currentMusic?.name)
    }));
  }
  async addToPlaylist(playlist: { title: string; type: string, contains: boolean }) {
    if (!this.currentMusic) return;
    const playlistsCollection = collection(this.firestore, 'PlayLists');
    const playlistsQuery = query(playlistsCollection, where('user', '==', this.userData?.username), where('title', '==', playlist.title));
    const querySnapshot = await getDocs(playlistsQuery);
    if (!querySnapshot.empty) {
      const playlistDoc = querySnapshot.docs[0];
      const playlistData = playlistDoc.data();
      const musicList: Zene[] = playlistData['songs'] || [];
      const musicIndex = musicList.findIndex(m => m.name === this.currentMusic?.name);
      if (musicIndex === -1) {
        musicList.push(this.currentMusic);
      } else {
        musicList.splice(musicIndex, 1);
      }
      await setDoc(doc(this.firestore, 'PlayLists', playlistDoc.id), {
        ...playlistData,
        songs: musicList
      });
      this.playListsComponent.refresh();

      this.showPlaylistMenu = !this.showPlaylistMenu;
    }
  }
  checkMSG(uname: string) {
    this.showUpload = false;
    this.showList = false;
    this.showSearch = false;
    this.showForum = false;
    this.showChat = true;
    this.showUser = false;
    this.showAdmin = false;
  }
  shutdownScheduled = false;
  private shutdownTimeoutId: any = null;
  toggleShutdownTimer() {
    if (this.shutdownScheduled) {
      clearTimeout(this.shutdownTimeoutId);
      this.shutdownScheduled = false;
    } else {
      this.shutdownTimeoutId = setTimeout(() => {
        this.logout();
      }, 30 * 60 * 1000);
      this.shutdownScheduled = true;
    }
  }
  showMenuLeft: boolean = false;
  toggleShowMenuLeft() {
    this.showMenuLeft = !this.showMenuLeft;
  }
}