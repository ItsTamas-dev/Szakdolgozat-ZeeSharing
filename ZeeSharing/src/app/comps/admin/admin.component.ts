import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, getDocs, deleteDoc, query, where, doc, updateDoc } from '@angular/fire/firestore';
import { UserService } from '../../user.service';
import { CommonModule } from '@angular/common';
import { deleteObject, getStorage, ref as storageRef } from '@angular/fire/storage';
import { getFunctions } from '@angular/fire/functions';
import { getApp } from 'firebase/app';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [CommonModule]
})
export class AdminComponent implements OnInit {
  firestore = inject(Firestore);
  userService = inject(UserService);
  functions = getFunctions(getApp());
  users: any[] = [];
  forumPosts: any[] = [];
  async ngOnInit() {
    await this.loadUsers();
    await this.loadForumPosts();
  }
  async loadUsers() {
    const usersCollection = collection(this.firestore, 'Users');
    const snapshot = await getDocs(usersCollection);
    this.users = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data };
    });
  }
  async deleteUser(user: any) {
    const confirmed = confirm(`Are you sure: ${user.username}?`);
    if (!confirmed) return;
    const username = user.username;
    const email = user.id;
    const defaultImgUrl = 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e';
    const deleteFromQuery = async (collectionName: string, field: string, value: string) => {
      const q = query(collection(this.firestore, collectionName), where(field, '==', value));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    };
    const deleteFromQueryMulti = async (collectionName: string, field1: string, field2: string, value: string) => {
      const q1 = query(collection(this.firestore, collectionName), where(field1, '==', value));
      const q2 = query(collection(this.firestore, collectionName), where(field2, '==', value));
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      for (const snap of [...snap1.docs, ...snap2.docs]) {
        await deleteDoc(snap.ref);
      }
    };
    const deleteMediaFromCollection = async (collectionName: string) => {
      const q = query(collection(this.firestore, collectionName), where('performer', '==', username));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const audioUrl = data['audioUrl'];
        const imgUrl = data['imgUrl'];
        const storage = getStorage();
        const deleteFile = async (url: string) => {
          if (url && url != defaultImgUrl) {
            try {
              const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
              const fileRef = storageRef(storage, path);
              await deleteObject(fileRef);
            } catch (err) {
            }
          }
        };
        await deleteFile(audioUrl);
        await deleteFile(imgUrl);
        await deleteDoc(docSnap.ref);
      }
    };
    await deleteDoc(doc(this.firestore, 'Users', user.id));
    this.users = this.users.filter(u => u.id !== user.id);
    await deleteFromQueryMulti('FollowLists', 'User1', 'User2', username);
    await deleteFromQuery('Follows', 'user', email);
    await deleteFromQuery('Forum', 'username', username);
    await deleteFromQueryMulti('Friends', 'User1', 'User2', username);
    await deleteFromQuery('PlayLists', 'user', username);
    await deleteFromQueryMulti('messages', 'receiver', 'sender', username);
    await deleteMediaFromCollection('Podcast');
    await deleteMediaFromCollection('Music');
  }
  async toggleAdmin(user: any) {
    const userRef = doc(this.firestore, 'Users', user.id);
    const newStatus = user.admin ? false : true;
    await updateDoc(userRef, { admin: newStatus });
    user.admin = newStatus;
  }
  async loadForumPosts() {
    const postsCollection = collection(this.firestore, 'Forum');
    const snapshot = await getDocs(postsCollection);
    this.forumPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  async deleteForumPost(post: any) {
    const confirmDelete = confirm("Are you sure?");
    if (!confirmDelete) return;
    const postsCollection = collection(this.firestore, 'Forum');
    const q = query(postsCollection,
      where('username', '==', post.username),
      where('createdAt', '==', post.createdAt)
    );
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    this.forumPosts = this.forumPosts.filter(p => p.createdAt !== post.createdAt || p.username !== post.username);
  }
}
