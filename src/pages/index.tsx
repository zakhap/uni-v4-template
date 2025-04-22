import type { NextPage } from 'next';
import { Layout } from '../components/Layout';
import { ContentmentCoin } from '../components/ContentmentCoin';
const Home: NextPage = () => {
  return (
    <Layout>
      <ContentmentCoin />
    </Layout>
  );
};

export default Home;
