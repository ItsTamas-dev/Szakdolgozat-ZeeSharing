import { Component, inject } from '@angular/core';
import { FormsModule, NonNullableFormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { Firestore, collection, query, where, getDocs, addDoc, DocumentData, deleteDoc, doc } from '@angular/fire/firestore';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../user.service';
import { EventEmitter, Input, Output } from '@angular/core';
export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-search',
  imports: [FormsModule, FontAwesomeModule, CommonModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  @Input() latestSongs: Zene[] = [];
  @Output() songClicked = new EventEmitter<{ songs: Zene[]; index: number }>();
  @Output() oneClicked = new EventEmitter<Zene>();
  searchText: string = '';
  firestore: Firestore = inject(Firestore);
  userData: any = null;
  faSearch = faSearch;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  searchSubject = new Subject<string>();
  searchResults: {
    musics: DocumentData[];
    podcast: DocumentData[];
    performers: DocumentData[];
    users: DocumentData[];
    tagMusics: DocumentData[];
  } = {
      musics: [],
      podcast: [],
      performers: [],
      users: [],
      tagMusics: []
    };
  constructor(private userService: UserService) {
    this.searchSubject
      .pipe(
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(text => this.performSearch(text));
    this.userData = this.userService.getUserData();

  }
  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }
  async performSearch(text: string) {
    if (this.searchText.length < 2) {
      this.searchResults = { musics: [], podcast: [], performers: [], users: [], tagMusics: [] };
      return;
    }
    const musicCollection = collection(this.firestore, 'Musics');
    const podcastCollection = collection(this.firestore, 'Podcasts');
    const usersCollection = collection(this.firestore, 'Users');
    const tagsCollection = collection(this.firestore, 'Tags');
    const musicQuery = query(musicCollection, where('name', '>=', text), where('name', '<=', text + '\uf8ff'));
    const musicSnapshot = await getDocs(musicQuery);
    this.searchResults.musics = musicSnapshot.docs.map(doc => doc.data());
    const tagQuery = query(tagsCollection, where('tag', '>=', text), where('tag', '<=', text + '\uf8ff'));
    const tagSnapshot = await getDocs(tagQuery);
    this.searchResults.tagMusics = tagSnapshot.docs.map(doc => doc.data());
    const podcastQuery = query(podcastCollection, where('name', '>=', text), where('name', '<=', text + '\uf8ff'));
    const podcastSnapshot = await getDocs(podcastQuery);
    this.searchResults.podcast = podcastSnapshot.docs.map(doc => doc.data());
    const performerQuery = query(usersCollection, where('type', 'in', ['performer', "podcast"]), where('username', '>=', text), where('username', '<=', text + '\uf8ff'));
    const performerSnapshot = await getDocs(performerQuery);
    this.searchResults.performers = performerSnapshot.docs.map(doc => doc.data());
    const userQuery = query(usersCollection, where('type', 'in', ['admin', 'def_user']), where('username', '>=', text), where('username', '<=', text + '\uf8ff'));
    const userSnapshot = await getDocs(userQuery);
    this.searchResults.users = userSnapshot.docs.map(doc => doc.data());
  }
  ResMusic!: DocumentData;
  ResTag: string = "";
  ResPerformer!: DocumentData;
  ResUser!: DocumentData;
  showMusics: DocumentData[] = [];
  showTagMusics: DocumentData[] = [];
  tagsSet = new Set<string>();
  isFollow: boolean = false;
  isFriend: number = 0;
  userPlaylists: { title: string; type: string, songs: Zene[], showMusics: boolean }[] = [];
  userFollowList: DocumentData[] = [];
  showResMusic(res: DocumentData) {
    this.ResTag = "";
    this.ResPerformer = {} as DocumentData;
    this.ResUser = {} as DocumentData;
    this.ResMusic = res;
    this.searchResults = { musics: [], podcast: [], performers: [], users: [], tagMusics: [] };
    this.onOneClicked(res);
  }
  async showResPerformer(res: DocumentData) {
    this.ResTag = "";
    this.ResUser = {} as DocumentData;
    this.ResMusic = {} as DocumentData;
    this.ResPerformer = res;
    this.searchResults = { musics: [], podcast: [], performers: [], users: [], tagMusics: [] };
    const db: string = res["type"] == "performer" ? "Musics" : "Podcasts";
    const musicCollection = collection(this.firestore, db);
    const musicQuery = query(musicCollection, where('performer', '==', this.ResPerformer["username"]));
    const musicSnapshot = await getDocs(musicQuery);
    this.showMusics = musicSnapshot.docs.map(doc => doc.data());
    musicSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data['tags'] && Array.isArray(data['tags'])) {
        data['tags'].forEach((tag: string) => this.tagsSet.add(tag));
      }
    });
    const followCollection = collection(this.firestore, 'Follows');
    const followQuery = query(followCollection, where('performer', '==', this.ResPerformer["username"]), where('user', '==', this.userData.email));
    const followSnapshot = await getDocs(followQuery);
    this.isFollow = !followSnapshot.empty;
  }
  async onSongSelected() {
    const musicCollection = collection(this.firestore, 'Musics');
    const musicQuery = query(musicCollection, where('performer', '==', this.ResPerformer["username"]));
    const musicSnapshot = await getDocs(musicQuery);
    const songs: Zene[] = musicSnapshot.docs.map(doc => doc.data() as Zene);
    this.songClicked.emit({ songs: songs, index: 0 });
  }
  onOneClicked(music: DocumentData) {
    const zene: Zene = {
      name: music['name'] || '',
      audio: music['audio'] || '',
      performer: music['performer'] || '',
      img: music['img'] || undefined,
      tags: music['tags'] || []
    };
    this.oneClicked.emit(zene);
  }
  async showResUser(res: DocumentData) {
    this.ResTag = ""
    this.ResPerformer = {} as DocumentData;
    this.ResMusic = {} as DocumentData;
    this.ResUser = res;
    const friendCollection = collection(this.firestore, 'Friends');
    const friendQuery = query(friendCollection, where('User2', '==', this.ResUser["username"]), where('User1', '==', this.userData["username"]));
    const friendSnapshot = await getDocs(friendQuery);
    if (friendSnapshot.empty) {
      this.isFriend = 0;
    } else {
      const friendData = friendSnapshot.docs[0].data();
      this.isFriend = friendData["type"] === 'friend' ? 2 : 1;
    }
    if (this.isFriend == 2) {
      const playListCollection = collection(this.firestore, 'PlayLists');
      const playListQuery = query(playListCollection, where('type', 'in', ['friends', 'public']), where('user', '==', this.ResUser["username"]));
      const querySnapshot = await getDocs(playListQuery);
      this.userPlaylists = querySnapshot.docs.map(docSnapshot => ({
        title: docSnapshot.data()['title'],
        type: docSnapshot.data()['type'],
        songs: docSnapshot.data()['songs'],
        showMusics: false
      }));
      const followListCollection = collection(this.firestore, 'FollowLists');
      const followListQuery = query(followListCollection, where('Follower', '==', this.userData["username"]), where('Followed', '==', this.ResUser["username"]));
      const followSnapshot = await getDocs(followListQuery);
      this.userFollowList = followSnapshot.docs.map(doc => doc.data());
    } else {
      const playListCollection = collection(this.firestore, 'PlayLists');
      const playListQuery = query(playListCollection, where('type', '==', 'public'), where('user', '==', this.ResUser["username"]));
      const querySnapshot = await getDocs(playListQuery);
      this.userPlaylists = querySnapshot.docs.map(docSnapshot => ({
        title: docSnapshot.data()['title'],
        type: docSnapshot.data()['type'],
        songs: docSnapshot.data()['songs'],
        showMusics: false
      }));
    }
    this.searchResults = { musics: [], podcast: [], performers: [], users: [], tagMusics: [] };
  }
  toggleMusicVisibility(title: string) {
    const playlist = this.userPlaylists.find(list => list["title"] === title);
    if (playlist) {
      playlist["showMusics"] = !playlist["showMusics"];
    }
  }
  async showResTags(res: string) {
    this.ResUser = {} as DocumentData;
    this.ResPerformer = {} as DocumentData;
    this.ResMusic = {} as DocumentData;
    this.ResTag = res;
    this.searchResults = { musics: [], podcast: [], performers: [], users: [], tagMusics: [] };
    const musicCollection = collection(this.firestore, 'Musics');
    const tagQuery = query(musicCollection, where('tags', 'array-contains', res));
    const tagSnapshot = await getDocs(tagQuery);
    const podcastCollection = collection(this.firestore, 'Podcasts');
    const podQuery = query(podcastCollection, where('tags', 'array-contains', res));
    const podSnapshot = await getDocs(podQuery);
    this.showTagMusics = [
      ...tagSnapshot.docs.map(doc => ({ ...doc.data(), type: 'music' })),
      ...podSnapshot.docs.map(doc => ({ ...doc.data(), type: 'podcast' }))
    ];
  }
  async follow(performer: string, action: number) {
    if (!this.userData) {
      return;
    }
    const followCollection = collection(this.firestore, 'Follows');
    const followQuery = query(
      followCollection,
      where('performer', '==', performer),
      where('user', '==', this.userData.email)
    );
    const followSnapshot = await getDocs(followQuery);
    if (action === 1) {
      if (followSnapshot.empty) {
        await addDoc(followCollection, {
          performer: performer,
          user: this.userData.email,
          followedAt: new Date()
        });
        this.isFollow = true;
      }
    } else {
      if (!followSnapshot.empty) {
        followSnapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(this.firestore, 'Follows', docSnap.id));
        });
        this.isFollow = false;
      }
    }
  }
  async request() {
    const followCollection = collection(this.firestore, 'Friends');
    const followQuery = query(
      followCollection,
      where('User1', '==', this.userData["username"]),
      where('User2', '==', this.ResUser["username"]
      )
    );
    const followSnapshot = await getDocs(followQuery);
    if (followSnapshot.empty) {
      await addDoc(followCollection, {
        User1: this.userData["username"],
        User2: this.ResUser["username"],
        type: "request"
      });
      this.isFriend = 1;
    } else {
      followSnapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(this.firestore, 'Friends', docSnap.id));
      });
      this.isFriend = 0;
    }
  }
  async addList(title: string) {
    const followCollection = collection(this.firestore, 'FollowLists');
    const followQuery = query(
      followCollection,
      where('User1', '==', this.userData["username"]),
      where('User2', '==', this.ResUser["username"]),
      where('Lista', '==', title)
    );
    const followSnapshot = await getDocs(followQuery);
    if (followSnapshot.empty) {
      await addDoc(followCollection, {
        User1: this.userData["username"],
        User2: this.ResUser["username"],
        Lista: title
      });
    } else {
      followSnapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(this.firestore, 'FollowLists', docSnap.id));
      });
    }
    if (this.userData) {
      this.showResUser(this.ResUser);
    }
  }
  isResPerformerNotEmpty(): boolean {
    return this.ResPerformer && Object.keys(this.ResPerformer).length > 0;
  }
  isResUserNotEmpty(): boolean {
    return this.ResPerformer && Object.keys(this.ResUser).length > 0;
  }
  isResTagNotEmpty(): boolean {
    return this.ResTag != "";
  }
  checkMSG(uname: string) {
  }
}
