import { Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, getDocs, startAfter, addDoc, Timestamp, deleteDoc, doc, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

import {Filter} from 'bad-words';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private postsSubject = new BehaviorSubject<any[]>([]);
  posts$ = this.postsSubject.asObservable();

  private newBadWords: any[] = ['fasz', 'f4sz', 'cigány', 'cig', 'náci', 'n4c1', 'kurva'];

  private lastPost: any = null;
  private filter = new Filter();

  constructor(private firestore: Firestore) {
    this.filter = new Filter();
    this.filter.addWords(...this.newBadWords);
  }

  async getPosts() {
    const postsCollection = collection(this.firestore, 'Forum');
    const postsQuery = query(
      postsCollection,
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        content: this.filter.clean(data['content']), // 🔸 szűrés itt
        username: this.filter.clean(data['username'])
      };
    });

    if (posts.length > 0) {
      this.lastPost = querySnapshot.docs[posts.length - 1];
    }

    this.postsSubject.next(posts);
  }

  async getOlderPosts() {
    if (!this.lastPost) return;

    const postsCollection = collection(this.firestore, 'Forum');
    const postsQuery = query(
      postsCollection,
      orderBy('createdAt', 'desc'),
      startAfter(this.lastPost.data().createdAt),
      limit(20)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        content: this.filter.clean(data['content']),
        username: this.filter.clean(data['username'])
      };
    });

    if (posts.length > 0) {
      this.lastPost = querySnapshot.docs[posts.length - 1];
      this.postsSubject.next([...this.postsSubject.getValue(), ...posts]);
    }
  }

  async addPost(content: string, username: string, imageUrl: string = 'NoImage') {
    const postsRef = collection(this.firestore, 'Forum');
  
    await addDoc(postsRef, {
      image: imageUrl,
      content: content,
      username: username,
      createdAt: Timestamp.now(),
    });
  }

  async deletePost(username: string, timestamp: number) {
    const postsRef = collection(this.firestore, 'Forum');
  
    const q = query(
      postsRef,
      where('username', '==', username),
      where('createdAt', '==', timestamp)
    );
  
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
    }
  }
}
