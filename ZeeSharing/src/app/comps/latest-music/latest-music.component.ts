import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, getDocs, where } from '@angular/fire/firestore';
import { NgFor } from '@angular/common';
import { EventEmitter, Input, Output } from '@angular/core';
export interface Zene {
  name: string;
  audio: string;
  performer: string;
  img?: string;
  tags?: string[];
}
@Component({
  selector: 'app-latest-music',
  standalone: true,
  imports: [NgFor],
  templateUrl: './latest-music.component.html',
  styleUrl: './latest-music.component.css'
})
export class LatestMusicComponent implements OnInit {
  @Input() latestSongs: Zene[] = [];
  @Output() songClicked = new EventEmitter<{ songs: Zene[]; index: number }>();
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
  constructor(private firestore: Firestore) { }
  async ngOnInit() {
    await this.loadLatestSongs();
  }
  async loadLatestSongs() {
    const musicCollection = collection(this.firestore, 'Musics');
    const musicQuery = query(musicCollection, orderBy('uploadDate', 'desc'), limit(6));
    const musicSnapshot = await getDocs(musicQuery);
    this.latestSongs = await Promise.all(musicSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      return {
        name: data['name'],
        audio: data['audio'],
        performer: data['performer'],
        img: data["img"] || 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e',
      };
    }));
  }
}
