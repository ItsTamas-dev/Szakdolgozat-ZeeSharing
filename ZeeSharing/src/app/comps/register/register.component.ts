import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  re_password: string = '';
  ac_type: string = '';
  u_name: string = '';
  registerError: string = '';
  constructor(private router: Router, private auth: Auth, private firestore: Firestore) { }
  async onRegister() {
    try {
      if (this.email.length === 0 || this.password.length === 0 || this.re_password.length === 0 || this.ac_type.length === 0) {
        this.registerError = "Please fill in all fields";
      } else if (this.password == this.re_password) {
        const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
        alert("Succesfull registration");

        const userDocRef = doc(this.firestore, `Users/${this.email}`);
        await setDoc(userDocRef, {
          type: this.ac_type,
          username: this.u_name,
          picture: 'https://firebasestorage.googleapis.com/v0/b/zeesharing-d33f2.appspot.com/o/image%2Flogo.png?alt=media&token=47edc7c9-f21d-4a55-a106-94df1952689e'
        });
        const userCredential2 = await signInWithEmailAndPassword(this.auth, this.email, this.password);
        await this.router.navigate(['/dashboard']);
      } else {
        this.registerError = "The two passwords are not the same!";
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        this.registerError = 'This email address is already in use!';
      } else {
        this.registerError = 'Registration failed! Please try again.';
      }
    }
  }
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}

