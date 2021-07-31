const flex = {
  display: "flex",
  justifyContent: "space-between",
  paddingRight: 12,
  paddingLeft: 35,
  marginBottom: -15,
};

const margin = {
  marginTop: 20,
  paddingLeft: 15,
};

const style = {
  minWidth: 175,
  padding: 5,
  paddingBottom: 15,
  background: "rgba(54, 56, 64, 0.5)",
  border: "1px solid rgba(118, 130, 153, 0.2)",
  borderRadius: 10,
};

const ballColors = [
  {
    position: "absolute",
    width: 16,
    height: 16,
    right: 15,
    top: -12,
    borderRadius: 10,
    background: "linear-gradient(180deg, #F5AC37 -10%, #EA9276 100%)",
    /* Inside Auto Layout */
    flex: "none",
    order: 0,
    flexGrow: 0,
    margin: 10,
  },
  {
    position: "absolute",
    width: 16,
    height: 16,
    right: 26,
    top: -12,
    borderRadius: 10,
    background: "linear-gradient(180deg, #768299 -10%, #98B3E9 100%)",
    /* Inside Auto Layout */
    flex: "none",
    order: 0,
    flexGrow: 0,
    margin: 10,
  },
];

const coinNames = ["DAI", "FRAX", "SUSHI"];

const renderDate = (index, payload, item) => {
  return index === payload.length - 1 ? (
    <div style={margin}>
      {new Date(item.payload.timestamp * 1000).toLocaleString("default", { month: "long" }).charAt(0).toUpperCase()}
      {new Date(item.payload.timestamp * 1000).toLocaleString("default", { month: "long" }).slice(1)}
      &nbsp;
      {new Date(item.payload.timestamp * 1000).getDate()}, {new Date(item.payload.timestamp * 1000).getFullYear()}
    </div>
  ) : (
    ""
  );
};

const renderTooltipItems = payload => {
  return payload.map((item, index) => (
    <div key={index}>
      <div style={flex}>
        <p style={{ position: "relative" }}>
          <div style={ballColors[index]}></div>
          {`${coinNames[index]}`}
        </p>
        <p>{`$${Math.round(item.value).toLocaleString("en-US")}`}</p>
      </div>
      <div>{renderDate(index, payload, item)}</div>
    </div>
  ));
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return <div style={style}>{renderTooltipItems(payload)}</div>;
  }
  return null;
}

export default CustomTooltip;
