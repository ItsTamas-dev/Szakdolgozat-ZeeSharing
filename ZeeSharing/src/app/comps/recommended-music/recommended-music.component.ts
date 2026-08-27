import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { UserService } from '../../user.service';
import { Firestore, collection, query, getDocs, where } from '@angular/fire/firestore';
import { EventEmitter, Input, Output } from '@angular/core';
export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-recommended-music',
  imports: [CommonModule],
  templateUrl: './recommended-music.component.html',
  styleUrl: './recommended-music.component.css'
})
export class RecommendedMusicComponent implements OnInit {
  @Input() latestSongs: Zene[] = [];
  @Output() songClicked = new EventEmitter<{ songs: Zene[]; index: number }>();
  constructor(
    private userService: UserService,
    private firestore: Firestore
  ) { }
  userData: User | null = null;
  ngOnInit(): void {
    this.userData = this.userService.getUserData();
    this.loadRecommendedSongs();
  }
  async onSongSelected(performer: string, name: string) {
    const musicCollection = collection(this.firestore, 'Musics');
    const filteredQuery = query(musicCollection, where('performer', '==', performer));
    const musicSnapshot = await getDocs(filteredQuery);
    const songClicked = await Promise.all(
      musicSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        return {
          name: data['name'],
          audio: data['audio'],
          performer: data['performer'],
          img: data['img'] || 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e',
          tags: data['tags'] || []
        } as Zene;
      })
    );
    const foundIndex = songClicked.findIndex((song) => song.name === name);
    this.songClicked.emit({
      songs: songClicked,
      index: foundIndex,
    });
  }
  async loadRecommendedSongs() {
    if (!this.userData) {
      this.userData = this.userService.getUserData();
    }
    const playHistoryCollection = collection(this.firestore, 'PlayHistory');
    const historyQuery = query(playHistoryCollection, where('user', '==', this.userData?.email));
    const historySnapshot = await getDocs(historyQuery);
    const tagCounts: Record<string, number> = {};
    historySnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const tags = data['tags'] || [];
      tags.forEach((tag: string | number) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    if (Object.keys(tagCounts).length === 0) {
      return;
    }
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    const musicCollection = collection(this.firestore, 'Musics');
    let recommendedSongs: Zene[] = [];
    for (const tag of sortedTags) {
      if (recommendedSongs.length >= 6) break;
      const tagQuery = query(musicCollection, where('tags', 'array-contains', tag));
      const musicSnapshot = await getDocs(tagQuery);
      let tagSongs = musicSnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          name: data['name'],
          audio: data['audio'],
          performer: data['performer'],
          img: data["img"] || 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e',
          tags: data['tags'] || []
        };
      });
      tagSongs = tagSongs.sort(() => Math.random() - 0.5);
      for (const song of tagSongs) {
        if (recommendedSongs.length >= 6) break;
        if (!recommendedSongs.some(s => s.name === song.name)) {
          recommendedSongs.push(song);
        }
      }
    }
    this.latestSongs = recommendedSongs.sort(() => Math.random() - 0.5);
  }
}
