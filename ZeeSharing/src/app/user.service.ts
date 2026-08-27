import { Injectable } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userDataSubject = new BehaviorSubject<any>(null);
  userData$ = this.userDataSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsed = JSON.parse(storedUserData);
      this.userDataSubject.next(parsed);
    }

    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.fetchUserData(user);
      } else {
        this.clearUserData();
      }
    });
  }

  setUserData(user: any, uname: string, pic: string, tipus: string) {
    const newData = {
      email: user.email,
      username: uname,
      picture: pic,
      type: tipus
    };
    this.userDataSubject.next(newData);
    localStorage.setItem('userData', JSON.stringify(newData));
  }

  async fetchUserData(user: User) {
    try {
      const userDocRef = doc(this.firestore, 'Users', user.email!);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        this.setUserData(user, userData['username'], userData['picture'], userData['type']);
      }
    } catch (error) {
    }
  }

  getUserData() {
    return this.userDataSubject.value;
  }

  clearUserData() {
    this.userDataSubject.next(null);
    localStorage.removeItem('userData');
  }
}
