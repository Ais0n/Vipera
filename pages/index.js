import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Header from '../components/Header';
import HomeDescription from '../components/HomeDescription';
import GoToOuroboros from '../components/GoToOuroboros';
import GoToDiscussionForum from '../components/GoToDiscussionForum';
import Footer from '../components/Footer';

// test
export default function Home() {
  return (
    <div>
      <Head>
        <title>Ouroboros</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
        <div className={styles.bgImage}>
          <img src={'/ouroborosbg.png'} alt="bg" />
        </div>
        <div className={styles.mainContainer}>
          <div className={styles.titleContainer}>
              Fight harmful bias in AI,<br></br>
              with data.
          </div>
          <div className={styles.descriptionContainer}>
              <HomeDescription />
          </div>
          <div className={styles.navButtons}>
            <div className={styles.genPageButton1}>
              <GoToOuroboros />
            </div>
            <div className={styles.genPageButton2}>
              <GoToDiscussionForum />
            </div>
          </div>

        </div>


      <Footer />

      {/* <footer>
        <a
          href="https://google.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="" alt="logo" className={styles.logo} />
        </a>
      </footer>  */}

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family:
            Menlo,
            Monaco,
            Lucida Console,
            Liberation Mono,
            DejaVu Sans Mono,
            Bitstream Vera Sans Mono,
            Courier New,
            monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
