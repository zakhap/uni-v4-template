import type { NextPage } from 'next';
import { Layout } from '../components/Layout';
import { TradingInterface } from '../components/TradingInterface';

const Home: NextPage = () => {
  return (
    <Layout>
      <TradingInterface />
    </Layout>
  );
};

export default Home;
