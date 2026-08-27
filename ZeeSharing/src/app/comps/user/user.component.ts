import { Component, inject, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { collection, getDocs, query, where, getFirestore, Timestamp } from 'firebase/firestore';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { sendPasswordResetEmail } from 'firebase/auth';
import { updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from 'firebase/storage';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../user.service';
import { Auth } from '@angular/fire/auth';
@Component({
  selector: 'app-user',
  imports: [NgChartsModule, CommonModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {
  constructor(private userService: UserService) { }
  firestore = getFirestore();
  userData: any = null;
  private auth = inject(Auth);
  artistChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [], datasets: [{
      label: '',
      data: [12, 19, 3, 5, 2, 3, 7],
      backgroundColor: [
        '#183D3D', '#183D3D', '#183D3D',
        '#183D3D', '#183D3D', '#183D3D', '#183D3D'
      ],
      borderRadius: 4
    }]
  };
  tagChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [], datasets: [{
      label: '',
      data: [12, 19, 3, 5, 2, 3, 7],
      backgroundColor: [
        '#183D3D', '#183D3D', '#183D3D',
        '#183D3D', '#183D3D', '#183D3D', '#183D3D'
      ],
      borderRadius: 4
    }]
  };
  topArtistChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [], datasets: [
      {
        label: '',
        data: [12, 19, 3, 5, 2, 3, 7],
        backgroundColor: [
          '#183D3D', '#183D3D', '#183D3D',
          '#183D3D', '#183D3D', '#183D3D', '#183D3D'
        ],
        borderRadius: 4
      }
    ],
  };
  topTagChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [], datasets: [
      {
        label: '',
        data: [12, 19, 3, 5, 2, 3, 7],
        backgroundColor: [
          '#183D3D', '#183D3D', '#183D3D',
          '#183D3D', '#183D3D', '#183D3D', '#183D3D'
        ],
        borderRadius: 4
      }
    ],
  };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } }
  };
  async ngOnInit() {
    this.userData = this.userService.getUserData();
    const listenings = await this.getLast7DaysListenings();
    await this.loadFriends();
    await this.loadFollow();
    await this.loadList();
    const artistCounts: { [key: string]: number } = {};
    const tagCounts: { [key: string]: number } = {};
    for (const item of listenings) {
      const artist = item['performer'] || 'Anonymus';
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      const tags = item['tags'] || [];
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    this.artistChartData = {
      labels: Object.keys(artistCounts),
      datasets: [{
        data: Object.values(artistCounts), label: 'Played', backgroundColor: [
          '#183D3D', '#183D3D', '#183D3D',
          '#183D3D', '#183D3D', '#183D3D', '#183D3D'
        ],
        borderRadius: 4
      }]
    };
    this.tagChartData = {
      labels: Object.keys(tagCounts),
      datasets: [{
        data: Object.values(tagCounts), label: 'Played', backgroundColor: [
          '#183D3D', '#183D3D', '#183D3D',
          '#183D3D', '#183D3D', '#183D3D', '#183D3D'
        ],
        borderRadius: 4
      }]
    };
    this.topArtistChartData = {
      labels: topArtists.map(([name]) => name),
      datasets: [{
        data: topArtists.map(([, count]) => count), label: 'Top 7 artist', backgroundColor: [
          '#183D3D', '#183D3D', '#183D3D',
          '#183D3D', '#183D3D', '#183D3D', '#183D3D'
        ],
        borderRadius: 4
      }]
    };
    this.topTagChartData = {
      labels: topTags.map(([tag]) => tag),
      datasets: [{
        data: topTags.map(([, count]) => count), label: 'Top 7 tag', backgroundColor: [
          '#183D3D', '#183D3D', '#183D3D',
          '#183D3D', '#183D3D', '#183D3D', '#183D3D'
        ],
        borderRadius: 4
      }]
    };
  }
  async getLast7DaysListenings(): Promise<any[]> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const listeningsCollection = collection(this.firestore, 'PlayHistory');
    const q = query(
      listeningsCollection,
      where('playedAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      where('user', '==', this.userData?.email)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }
  async changePassword() {
    await sendPasswordResetEmail(this.auth, this.userData?.email);
    alert('A password reset link has been sent to your email!');
  }
  friends: { id: string; name: string }[] = [];
  selectedFriendId: string | null = null;
  async loadFriends() {
    const friendsCol = collection(this.firestore, 'Friends');
    const query1 = query(friendsCol, where('User1', '==', this.userData.username));
    const query2 = query(friendsCol, where('User2', '==', this.userData.username));
    const [snapshot1, snapshot2] = await Promise.all([getDocs(query1), getDocs(query2)]);
    this.friends = [];
    snapshot1.forEach(doc => {
      const data = doc.data() as any;
      this.friends.push({ id: doc.id, name: data.User2 });
    });
    snapshot2.forEach(doc => {
      const data = doc.data() as any;
      this.friends.push({ id: doc.id, name: data.User1 });
    });
  }
  async removeSelectedFriend() {
    const confirmed = confirm('Are you sure?');
    if (confirmed) {
      const friendsCollection = collection(this.firestore, 'Friends');
      const q1 = query(
        friendsCollection,
        where('User1', '==', this.selectedFriendId),
        where('User2', '==', this.userData["username"])
      );
      const q2 = query(
        friendsCollection,
        where('User2', '==', this.selectedFriendId),
        where('User1', '==', this.userData["username"])
      );
      const snapshot1 = await getDocs(q1);
      const snapshot2 = await getDocs(q2);
      if (!snapshot1.empty) {
        const docRef = snapshot1.docs[0].ref;
        await deleteDoc(docRef);
        this.loadFriends();
      }
      if (!snapshot2.empty) {
        const docRef = snapshot2.docs[0].ref;
        await deleteDoc(docRef);
        this.loadFriends();
      }
    }
  }
  following: { id: string; name: string }[] = [];
  selectedfollow: string | null = null;
  async loadFollow() {
    const friendsCol = collection(this.firestore, 'Follows');
    const query1 = query(friendsCol, where('user', '==', this.userData.email),);
    const snapshot = await getDocs(query1);
    this.following = [];
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      this.following.push({ id: doc.id, name: data.performer });
    });
  }
  async removeSelectedFollow() {
    const confirmed = confirm('Are you sure?');
    if (confirmed) {
      const friendsCollection = collection(this.firestore, 'Follows');
      const q1 = query(
        friendsCollection,
        where('performer', '==', this.selectedfollow),
        where('user', '==', this.userData?.email)
      );
      const snapshot1 = await getDocs(q1);
      if (!snapshot1.empty) {
        const docRef = snapshot1.docs[0].ref;
        await deleteDoc(docRef);
        this.loadFollow();
      }
    }
  }
  playlists: { id: string; title: string }[] = [];
  selectedList: string | null = null;
  async loadList() {
    const friendsCol = collection(this.firestore, 'PlayLists');
    const query1 = query(friendsCol, where('user', '==', this.userData.username),);
    const snapshot = await getDocs(query1);
    this.playlists = [];
    snapshot.forEach(doc => {
      const data = doc.data() as any;
      this.playlists.push({ id: doc.id, title: data.title });
    });
  }
  async removeSelectedFList() {
    const confirmed = confirm('Are you sure?');
    if (confirmed) {
      const friendsCollection = collection(this.firestore, 'PlayLists');
      const q1 = query(
        friendsCollection,
        where('title', '==', this.selectedList),
        where('user', '==', this.userData?.username)
      );
      const snapshot1 = await getDocs(q1);
      if (!snapshot1.empty) {
        const docRef = snapshot1.docs[0].ref;
        await deleteDoc(docRef);
        this.loadList();
      }
    }
  }
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const username = this.userData?.username;
    if (!username) {
      alert('Felhasználónév nem elérhető.');
      return;
    }
    const storage = getStorage();
    const imagePath = `user_img/${username}.jpg`;
    const imageRef = ref(storage, imagePath);
    try {
      if (this.userData.profilePic) {
        const oldRef = ref(storage, this.userData.profilePic);
        await deleteObject(oldRef).catch(() => { });
      }
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      const usersCollection = collection(this.firestore, 'Users');
      const q = query(usersCollection, where('username', '==', username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0].ref;
        await updateDoc(userDoc, { picture: downloadURL });
        this.userData.picture = downloadURL;
        const currentData = this.userService.getUserData();
        this.userService.setUserData(
          currentData["email"],
          currentData.username,
          downloadURL,
          currentData.type
        );
        alert('New Profile image saved!');
      } else {
      }
    } catch (error) {
    }
  }
}