import React from "react";

const styles = {
  root: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "24px",
    fontWeight: "bold",
    backgroundColor: "#000000ff",
    color: "#ffffff",
  },
};

const NotFound = () => {
  return <div style={styles.root}>404 - Not Found</div>;
};

export default NotFound;
