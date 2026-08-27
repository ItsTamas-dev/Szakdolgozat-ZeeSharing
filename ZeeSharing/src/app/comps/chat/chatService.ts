import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, getDocs } from '@angular/fire/firestore';
import { DocumentData, Timestamp } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
interface FriendRequest {
  id: string;
  User1: string;
  User2: string;
  type: string;
  profilePicture?: string;
}
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<any[]>([]);
  messages$ = this.messagesSubject.asObservable();
  private unreadMessagesSubject = new BehaviorSubject<any[]>([]);
  unreadMessages$ = this.unreadMessagesSubject.asObservable();
  constructor(private firestore: Firestore) { }
  async sendMessage(sender: string, receiver: string, message: string) {
    const messagesCollection = collection(this.firestore, 'messages');
    await addDoc(messagesCollection, {
      sender,
      receiver,
      message,
      type: 'msg',
      time: Timestamp.now(),
      seen: false
    });
  }
  async sendMusic(sender: string, receiver: string, message: DocumentData) {
    const messagesCollection = collection(this.firestore, 'messages');

    await addDoc(messagesCollection, {
      sender,
      receiver,
      message,
      type: 'music',
      time: Timestamp.now(),
      seen: false
    });
  }
  async getIncomingFriendRequests(currentUser: string): Promise<FriendRequest[]> {
    const friendsCollection = collection(this.firestore, 'Friends');
    const friendRequestsQuery = query(
      friendsCollection,
      where('User2', '==', currentUser),
      where('type', '==', 'request')
    );
    const snapshot = await getDocs(friendRequestsQuery);
    const requests: FriendRequest[] = snapshot.docs.map(doc => ({ ...(doc.data() as FriendRequest) }));

    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const user1 = request.User1;
        const usersCollection = collection(this.firestore, 'Users');
        const userQuery = query(usersCollection, where('username', '==', user1));
        const userSnapshot = await getDocs(userQuery);
        let profilePicture = null;
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          profilePicture = userData["picture"] || null;
        }
        return {
          ...request,
          profilePicture
        };
      })
    );
    return enrichedRequests;
  }
  listenForMessages(sender: string, receiver: string) {
    const messagesCollection = collection(this.firestore, 'messages');
    const q1 = query(
      messagesCollection,
      where('sender', '==', sender),
      where('receiver', '==', receiver),
      orderBy('time', 'asc')
    );
    const q2 = query(
      messagesCollection,
      where('sender', '==', receiver),
      where('receiver', '==', sender),
      orderBy('time', 'asc')
    );
    let messagesFromSender: any[] = [];
    let messagesFromReceiver: any[] = [];
    const updateCombinedMessages = () => {
      const combined = [...messagesFromSender, ...messagesFromReceiver];
      combined.sort((a, b) => a.time.seconds - b.time.seconds);
      this.messagesSubject.next(combined);
    };
    const unsub1 = onSnapshot(q1, (snapshot) => {
      messagesFromSender = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateCombinedMessages();
    });
    const unsub2 = onSnapshot(q2, (snapshot) => {
      messagesFromReceiver = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateCombinedMessages();
    });
    return () => {
      unsub1();
      unsub2();
    };
  }
  listenForMessagesAll(user: string) {
    const messagesCollection = collection(this.firestore, 'messages');
    const messagesQuery = query(
      messagesCollection,
      where('receiver', '==', user),
      where('seen', '==', false)
    );
    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.unreadMessagesSubject.next([...messages]);
      },
      (error) => {
      }
    );
  }
  unreadFromUsers = new Map<string, boolean>();
  listenForUnreadPerUser(currentUser: string, friends: any[]): Map<string, boolean> {
    const messagesCollection = collection(this.firestore, 'messages');
    const unreadStatus = new Map<string, boolean>();
    friends.forEach(friend => {
      const friendUsername = friend["username"];
      const messagesQuery = query(
        messagesCollection,
        where('sender', '==', friendUsername),
        where('receiver', '==', currentUser),
        where('seen', '==', false)
      );
      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const hasUnread = !snapshot.empty;
          unreadStatus.set(friendUsername, hasUnread);
        },
        (error) => {
        }
      );
    });
    return unreadStatus;
  }
  async markMessagesAsSeen(sender: string, receiver: string) {
    const messagesCollection = collection(this.firestore, 'messages');
    const messagesQuery = query(
      messagesCollection,
      where('sender', '==', receiver),
      where('receiver', '==', sender),
      where('seen', '==', false)
    );
    const snapshot = await getDocs(messagesQuery);
    snapshot.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, { seen: true });
    });
  }
}
