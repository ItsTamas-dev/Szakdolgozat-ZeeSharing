import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-popular-music',
  imports: [CommonModule],
  templateUrl: './popular-music.component.html',
  styleUrl: './popular-music.component.css'
})
export class PopularMusicComponent implements OnInit {
  @Input() latestSongs: Zene[] = [];
  @Output() songClicked = new EventEmitter<{ songs: Zene[]; index: number }>();
  constructor(
    private firestore: Firestore
  ) { }
  ngOnInit(): void {
    this.loadPopularMusic();
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
  async loadPopularMusic() {
    const playHistoryCollection = collection(this.firestore, 'PlayHistory');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const historyQuery = query(playHistoryCollection, where('playedAt', '>=', oneWeekAgo));
    const historySnapshot = await getDocs(historyQuery);
    const songCounts: Record<string, { count: number; data: Zene }> = {};
    historySnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const songKey = `${data['name']} - ${data['performer']}`;
      if (!songCounts[songKey]) {
        songCounts[songKey] = {
          count: 0,
          data: {
            name: data['name'],
            audio: data['audio'],
            performer: data['performer'],
            img: data["img"] || 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e',
            tags: data['tags'] || []
          }
        };
      }
      songCounts[songKey].count += 1;
    });
    this.latestSongs = Object.values(songCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(entry => entry.data);
  }
}
