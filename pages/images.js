import styles from '../styles/ImageGrid.module.css';

const imageList = [
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/D2PNBXYCDE52.png",
    alt: "Description of image 1",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/JOB1MELWFN9O.png",
    alt: "Description of image 2",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/OZMBL5KNA0KC.png",
    alt: "Description of image 3",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/B7R70L1P2L43.png",
    alt: "Description of image 4",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/ID437Y9727LA.png",
    alt: "Description of image 5",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/8BDXCVXYY24B.png",
    alt: "Description of image 6",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/EZPJM7ZHPRQM.png",
    alt: "Description of image 7",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/F27MQHRSYVAH.png",
    alt: "Description of image 8",
  },
  {
    src: "https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/NW0MNSFEYV3K.png",
    alt: "Description of image 9",
  },
];

function ImageCell({ src, alt }) {
    return <img className={styles.image_cell} src={src} alt={alt} />;
}

export default function ImageGrid() {
    return (
      <section>
        <h1>Images</h1>
        <div className={styles.image_grid}>
          {imageList.map((image, index) => (
            <ImageCell key={index} src={image.src} alt={image.alt} />
          ))}
        </div>
      </section>
    );
  }
