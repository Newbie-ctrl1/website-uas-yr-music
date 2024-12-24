'use client';

import { useState } from 'react';
import { auth } from '../../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { Mail, Lock, LogIn, Music2, UserPlus } from 'lucide-react';
import styles from './Login.module.css';

const DEFAULT_WALLETS = ['RendiPay', 'ErwinPay', 'DindaPay'];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let userCredential;
      
      if (isLogin) {
        // Login
        userCredential = await signInWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
      } else {
        // Register
        userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );

        // Update display name jika registrasi
        if (formData.displayName) {
          await updateProfile(userCredential.user, {
            displayName: formData.displayName
          });
        }
      }

      // Simpan user ke PostgreSQL
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: isLogin ? userCredential.user.displayName : formData.displayName,
          photoURL: userCredential.user.photoURL
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan data pengguna');
      }

      // Inisialisasi dompet jika registrasi
      if (!isLogin) {
        const walletResponse = await fetch('/api/wallets/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userCredential.user.uid,
            walletTypes: DEFAULT_WALLETS
          }),
        });

        if (!walletResponse.ok) {
          console.error('Gagal menginisialisasi dompet');
        }
      }

      // Reset form setelah berhasil
      setFormData({ email: '', password: '', displayName: '' });
      
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = '';
      
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Email atau password salah';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email sudah terdaftar';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password terlalu lemah (minimal 6 karakter)';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <Music2 size={40} className={styles.logo} />
          <h1 className={styles.title}>YR Music</h1>
        </div>
        
        <p className={styles.subtitle}>
          {isLogin ? 'Masuk ke akun Anda' : 'Daftar akun baru'}
        </p>
        
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.error}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <UserPlus size={20} className={styles.inputIcon} />
              <input
                type="text"
                name="displayName"
                placeholder="Nama Lengkap"
                value={formData.displayName}
                onChange={handleInputChange}
                className={styles.input}
                required={!isLogin}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <Mail size={20} className={styles.inputIcon} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock size={20} className={styles.inputIcon} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={styles.input}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`${styles.button} ${isLoading ? styles.loading : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.loadingSpinner} />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>{isLogin ? 'Masuk' : 'Daftar'}</span>
              </>
            )}
          </button>
        </form>

        <p className={styles.footer}>
          {isLogin ? (
            <>
              Belum punya akun?{' '}
              <button 
                onClick={() => setIsLogin(false)} 
                className={styles.link}
              >
                Daftar
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <button 
                onClick={() => setIsLogin(true)} 
                className={styles.link}
              >
                Masuk
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
} 