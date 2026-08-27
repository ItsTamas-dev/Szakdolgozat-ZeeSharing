import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSmile, faPaperPlane, faMusic, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { Firestore, collection, query, where, getDocs, DocumentData } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';
import { FriendsComponent } from '../friends/friends.component';
import { FriendService } from '../friends/friendservice';
import { UserService } from '../../user.service';
import { ChatService } from './chatService';
export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  providers: [FriendsComponent]
})
export class ChatComponent implements OnInit, OnDestroy {
  userData: any = null;
  sender: string = "";
  receiver: string | null = null;
  messages: any[] = [];
  newMessage: string = '';
  messagesSub!: Subscription;
  receiverData: { username: string; picture: string } | null = null;
  faSmile = faSmile;
  faPaperPlane = faPaperPlane;
  faMusic = faMusic;
  faPlay = faPlayCircle;
  constructor(
    private friendComponent: FriendsComponent,
    private friendService: FriendService,
    private chatService: ChatService,
    private userService: UserService,
    private firestore: Firestore,
    private cdref: ChangeDetectorRef
  ) {
    this.searchSubject
      .pipe(
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(text => this.performSearch(text));
  }
  private unsubscribeFromMessages: (() => void) | null = null;
  async ngOnInit() {
    this.userData = this.userService.getUserData();
    this.sender = this.userData["username"];
    this.friendService.username$.subscribe(uname => {
      if (uname && uname !== this.receiver) {

        this.receiver = uname;

        if (this.unsubscribeFromMessages) {
          this.unsubscribeFromMessages();
          this.unsubscribeFromMessages = null;
        }

        this.unsubscribeFromMessages = this.chatService.listenForMessages(this.sender, this.receiver);
        this.chatService.markMessagesAsSeen(this.sender, this.receiver);
      }
    });
    this.messagesSub = this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      this.cdref.detectChanges();
      setTimeout(() => this.scrollToBottom(), 100);
    });
    const friendListsCollection = collection(this.firestore, 'Users');
    const friendListsQuery1 = query(friendListsCollection, where('username', '==', this.receiver));
    const querySnapshot = await getDocs(friendListsQuery1);
    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      this.receiverData = {
        username: docSnapshot.data()['username'],
        picture: docSnapshot.data()['picture']
      };
    }
  }
  ngOnDestroy() {
    if (this.unsubscribeFromMessages) {
      this.unsubscribeFromMessages();
    }
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
  }
  sendMessage() {
    if (this.newMessage.trim() && this.receiver != null) {
      this.chatService.sendMessage(this.sender, this.receiver, this.newMessage);
      this.newMessage = '';
    }
  }
  markAsRead(messageId: string) { }
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  ngAfterViewInit() {
    this.scrollToBottom();
  }
  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
    }
  }
  isShowMusic: boolean = false;
  showMusic() {
    this.isShowMusic = !this.isShowMusic;
  }
  searchText: string = '';
  searchSubject = new Subject<string>();
  searchResultsMusic: DocumentData[] = [];
  searchResultsPodcast: DocumentData[] = [];
  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }
  async performSearch(text: string) {
    if (this.searchText.length < 2) {
      this.searchResultsMusic = [];
      this.searchResultsPodcast = [];
      return;
    }
    const musicCollection = collection(this.firestore, 'Musics');
    const musicQuery = query(musicCollection, where('name', '>=', text), where('name', '<=', text + '\uf8ff'));
    const musicSnapshot = await getDocs(musicQuery);
    this.searchResultsMusic = musicSnapshot.docs.map(doc => doc.data());

    const podcastCollection = collection(this.firestore, 'Podcasts');
    const podcastQuery = query(podcastCollection, where('name', '>=', text), where('name', '<=', text + '\uf8ff'));
    const podcastSnapshot = await getDocs(podcastQuery);
    this.searchResultsPodcast = podcastSnapshot.docs.map(doc => doc.data());

  }
  sendResMusic(res: DocumentData) {
    if (this.receiver != null) {
      this.chatService.sendMusic(this.sender, this.receiver, res);
      this.searchText = "";
      this.searchResultsMusic = [];
      this.searchResultsPodcast = [];
      this.isShowMusic = false;
    }
  }
  @Output() oneClicked = new EventEmitter<Zene>();
  play(res: DocumentData) {
    this.onOneClicked(res);
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
}
