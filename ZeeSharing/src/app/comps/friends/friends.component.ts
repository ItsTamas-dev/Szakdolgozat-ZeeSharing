import { Component, OnInit, inject } from '@angular/core';
import { UserService } from '../../user.service';
import { Firestore, collection, query, where, getDocs, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircle, faCheck, faX } from '@fortawesome/free-solid-svg-icons';

import { EventEmitter, Output } from '@angular/core';

import { FriendService } from './friendservice';
import { ChatService } from '../chat/chatService';
import { Subscription } from 'rxjs';

export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-friends',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css'
})
export class FriendsComponent implements OnInit {
  friends_data: any[] = [];
  firestore = inject(Firestore);
  userService = inject(UserService);
  userData: any = null;
  faCircle = faCircle;
  faCheck = faCheck;
  faX = faX;
  private messagesSub!: Subscription;
  unreadUnsubscribes: Map<string, boolean> = new Map();
  friendRequests: any[] = [];
  @Output() friend = new EventEmitter<string>();
  @Output() songClicked = new EventEmitter<{ songs: Zene[]; index: number }>();
  constructor(private friendService: FriendService, private chatService: ChatService) { }
  async ngOnInit() {
    this.userData = this.userService.getUserData();
    await this.getFriends();
    this.getFollowedPerformers();

    this.unreadUnsubscribes = this.chatService.listenForUnreadPerUser(this.userData["username"], this.friends_data);
    this.chatService.getIncomingFriendRequests(this.userData["username"]).then(requests => {
      this.friendRequests = requests;
    });
  }
  async getFriends() {
    const friendListsCollection = collection(this.firestore, 'Friends');
    const friendListsQuery1 = query(
      friendListsCollection,
      where('User1', '==', this.userData['username']),
      where('type', '==', 'friend')
    );
    const friendListsQuery2 = query(
      friendListsCollection,
      where('User2', '==', this.userData['username']),
      where('type', '==', 'friend')
    );
    const [friendSnapshot1, friendSnapshot2] = await Promise.all([
      getDocs(friendListsQuery1),
      getDocs(friendListsQuery2)
    ]);
    const allFriendDocs = [...friendSnapshot1.docs, ...friendSnapshot2.docs];
    const friendUsernames = new Set<string>();
    allFriendDocs.forEach(doc => {
      const data = doc.data();
      const friendUsername = data["User1"] !== this.userData['username']
        ? data["User1"]
        : data["User2"];
      friendUsernames.add(friendUsername);
    });
    const usersCollection = collection(this.firestore, 'Users');
    const friendDataPromises = Array.from(friendUsernames).map(async (username) => {
      const q = query(usersCollection, where('username', '==', username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return {
          username: userDoc.data()['username'],
          picture: userDoc.data()['picture'] || null
        };
      }
      return null;
    });
    const resolvedFriends = await Promise.all(friendDataPromises);
    this.friends_data = resolvedFriends.filter(f => f !== null);
  }
  sendUsername = "";
  friendClicked(uname: string) {
    this.friendService.setUsername(uname);
    this.friend.emit(this.sendUsername);
  }
  getUsername() {
    return this.sendUsername;
  }
  hasUnread(username: string): boolean {
    return this.unreadUnsubscribes.get(username) || false;
  }
  async addFriend(friend: string) {
    const friendsCollection = collection(this.firestore, 'Friends');
    const q = query(
      friendsCollection,
      where('User1', '==', friend),
      where('User2', '==', this.userData["username"]),
      where('type', '==', 'request')
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { type: 'friend' });
      this.loadIncomingRequests();
    }
  }
  async deleteRequest(friend: string) {
    const friendsCollection = collection(this.firestore, 'Friends');
    const q = query(
      friendsCollection,
      where('User1', '==', friend),
      where('User2', '==', this.userData["username"]),
      where('type', '==', 'request')
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await deleteDoc(docRef);
      this.loadIncomingRequests();
    }
  }
  loadIncomingRequests() {
    this.getFriends();
    this.chatService.getIncomingFriendRequests(this.userData["username"]).then(requests => {
      this.friendRequests = requests;
    });
  }
  followedPerformers: any[] = [];
  async getFollowedPerformers() {
    if (!this.userData?.username) return;
    const followedCollection = collection(this.firestore, 'Follows');
    const q = query(followedCollection, where('user', '==', this.userData.email));
    const snapshot = await getDocs(q);
    const performerUsernames = snapshot.docs.map(doc => doc.data()['performer']);
    const usersCollection = collection(this.firestore, 'Users');
    const performerDataPromises = performerUsernames.map(async (uname) => {
      const userQuery = query(usersCollection, where('username', '==', uname));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        return {
          username: userData['username'],
          picture: userData['picture'] || null,
        };
      }
      return null;
    });
    const resolvedPerformers = await Promise.all(performerDataPromises);
    this.followedPerformers = resolvedPerformers.filter(p => p !== null);
  }
  async performerClicked(perfomer: string) {
    const musicCollection = collection(this.firestore, 'Musics');
    const musicQuery = query(musicCollection, where('performer', '==', perfomer));
    const musicSnapshot = await getDocs(musicQuery);
    const songs: Zene[] = musicSnapshot.docs.map(doc => doc.data() as Zene);
    this.songClicked.emit({ songs: songs, index: 0 });
  }
}
