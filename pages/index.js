import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Header from '../components/Header';
import HomeDescription from '../components/HomeDescription';
import GoToVipera from '../components/GoToVipera';
import GoToDiscussionForum from '../components/GoToDiscussionForum';
import Footer from '../components/Footer';

// test
const Home = () => {
  const STEPS_IMAGES = [
    { id: 'step1', src: '/step1.svg', alt: 'Step 1' },
    { id: 'step2', src: '/step2.svg', alt: 'Step 2' },
    { id: 'step3', src: '/step3.svg', alt: 'Step 3' },
  ];

  const TRENDING_IMAGES = [
    { id: 'homePost1', src: '/homePost1.svg', alt: 'Trending Post 1' },
    { id: 'homePost2', src: '/homePost2.svg', alt: 'Trending Post 2' },
  ];

  return (
    <div>
      <Head>
        <title>Ouroboros</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
        <div className={styles.bgImage}>
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
                <GoToVipera />
              </div>
              <div className={styles.genPageButton2}>
                <GoToDiscussionForum />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.stepContainer}>
          <div className={styles.firstTitle}>OUROBOROS</div>
          <div className={styles.secondTitle}>3 Key Steps to Fight Bias</div>
          <div className={styles.steps}>
            {STEPS_IMAGES.map(image => (
              <div key={image.id} className={styles.stepImageWrapper}>
                <img src={image.src} alt={image.alt} className={styles.stepImage} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.trendingContainer}>
          <div className={styles.firstTitle}>WEAUDIT</div>
          <div className={styles.secondTitle}>Trending discussion posts</div>
          <div className={styles.trendingPosts}>
            {TRENDING_IMAGES.map(image => (
              <div key={image.id} className={styles.trendingImageWrapper}>
                <img src={image.src} alt={image.alt} className={styles.trendingImage} />
              </div>
            ))}
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

export default Home;