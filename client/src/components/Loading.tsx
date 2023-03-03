import Layout from './Layout';

const Loading = () => {
  return (
    <Layout>
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </Layout>
  );
};

export default Loading;
