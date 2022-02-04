import { Trans } from "@lingui/macro";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  SvgIcon,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Icon } from "@olympusdao/component-library";
import { BigNumber, ethers } from "ethers";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { trim } from "src/helpers";
import { useAppSelector, useWeb3Context } from "src/hooks";
import { changeZapTokenAllowance, executeZap, getZapTokenAllowance, zapNetworkCheck } from "src/slices/ZapSlice";

import { ReactComponent as DownIcon } from "../../assets/icons/arrow-down.svg";
import { ReactComponent as ZapperIcon } from "../../assets/icons/powered-by-zapper.svg";
import { ReactComponent as FirstStepIcon } from "../../assets/icons/step-1.svg";
import { ReactComponent as SecondStepIcon } from "../../assets/icons/step-2.svg";
import { ReactComponent as CompleteStepIcon } from "../../assets/icons/step-complete.svg";
import { segmentUA } from "../../helpers/userAnalyticHelpers";
import SelectTokenModal from "./SelectTokenModal";
import SlippageModal from "./SlippageModal";
import ZapStakeHeader from "./ZapStakeHeader";

const DISABLE_ZAPS = false;

const iconStyle = { height: "24px", width: "24px", zIndex: 1 };
const viewBox = "-8 -12 48 48";
const buttonIconStyle = { height: "16px", width: "16px", marginInline: "6px" };

const useStyles = makeStyles(theme => ({
  ApprovedButton: {
    backgroundColor: theme.palette.type === "light" ? "#9EC4AB !important" : "#92A799 !important",
  },
  ApprovedText: {
    color: theme.palette.type === "light" ? "#fff" : "#333333",
  },
}));

type ZapQuantity = string | number | null;

const ZapStakeAction: React.FC = () => {
  const { address, provider, networkId } = useWeb3Context();

  const dispatch = useDispatch();
  const classes = useStyles();
  const tokens = useAppSelector(state => state.zap.balances);
  const isTokensLoading = useAppSelector(state => state.zap.balancesLoading);
  const isChangeAllowanceLoading = useAppSelector(state => state.zap.changeAllowanceLoading);
  const isExecuteZapLoading = useAppSelector(state => state.zap.stakeLoading);
  const [zapToken, setZapToken] = useState<string | null>(null);

  const handleSelectZapToken = (token: string) => {
    const uaData = {
      type: "OlyZaps Token Select",
      token: token,
      address: address,
    };
    segmentUA(uaData);
    setZapToken(token);
    handleClose();
  };

  useEffect(() => {
    if (zapToken == null || !tokens[zapToken]) {
      setZapToken(null);
    }
  }, [zapToken]);

  useEffect(() => {
    dispatch(zapNetworkCheck({ networkID: networkId }));
  }, []);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const handleOpen = () => {
    setModalOpen(true);
  };
  const handleClose = () => setModalOpen(false);

  const [slippageModalOpen, setSlippageModalOpen] = useState(false);
  const handleSlippageModalOpen = () => setSlippageModalOpen(true);
  const handleSlippageModalClose = () => setSlippageModalOpen(false);

  const [inputQuantity, setInputQuantity] = useState("");
  const [outputQuantity, setOutputQuantity] = useState("");

  const olyZapsSwapOfferDisplay = (outputQuantity: Partial<string | number>) => {
    const uaData = {
      type: "OlyZaps Offer Display",
      token: zapToken,
      minOutput: outputQuantity,
    };
    segmentUA(uaData);
  };

  const ohmMarketPrice = useAppSelector(state => state.app.marketPrice || 0);

  const sOhmBalance = useAppSelector(state => Number(state.account?.balances?.sohm ?? 0.0));

  const exchangeRate = zapToken ? ohmMarketPrice / tokens[zapToken]?.price : 0;

  const setZapTokenQuantity = (q: ZapQuantity) => {
    if (q == null || q === "") {
      setInputQuantity("");
      setOutputQuantity("");
      return;
    }
    setInputQuantity(q.toString());
    setOutputQuantity((+q / exchangeRate).toString());
    if (outputQuantity) {
      olyZapsSwapOfferDisplay(outputQuantity);
    }
  };

  const setOutputTokenQuantity = (q: ZapQuantity) => {
    if (q == null || q === "") {
      setInputQuantity("");
      setOutputQuantity("");
      return;
    }
    const amount = Number(q);
    setOutputQuantity(q.toString());
    setInputQuantity((+q * exchangeRate).toString());
  };

  useEffect(() => setZapTokenQuantity(null), [zapToken]);

  const inputTokenImages = useMemo(
    () =>
      Object.entries(tokens)
        .filter(token => token[0] !== "sohm" && !token[1].hide)
        .sort((tokenA, tokenB) => tokenB[1].balanceUSD - tokenA[1].balanceUSD)
        .map(token => token[1].tokenImageUrl)
        .slice(0, 3),
    [tokens],
  );
  const currentTokenAllowance = useAppSelector(state => state.zap.allowances[zapToken ?? ""]?.gt(BigNumber.from(0)));
  const checkTokenAllowance = (tokenAddress: string, tokenSymbol: string) => {
    if (tokenAddress && tokenSymbol) {
      if (currentTokenAllowance == null) {
        dispatch(getZapTokenAllowance({ value: tokenAddress, address, networkID: networkId, provider }));
      } else {
        return currentTokenAllowance;
      }
    } else {
      return false;
    }
  };

  const isTokenAllowanceFetched = currentTokenAllowance != null;

  const initialTokenAllowance = useMemo(() => {
    if (zapToken) {
      return checkTokenAllowance(tokens[zapToken]?.address, zapToken);
    }
  }, [zapToken, isTokenAllowanceFetched]);

  const isAllowanceTxSuccess =
    initialTokenAllowance != currentTokenAllowance && initialTokenAllowance != null && currentTokenAllowance != null;

  const onSeekApproval = async () => {
    if (zapToken) {
      dispatch(
        changeZapTokenAllowance({
          address,
          value: tokens[zapToken]?.address,
          provider,
          action: zapToken,
          networkID: networkId,
        }),
      );
    }
  };

  const downIcon = <SvgIcon component={DownIcon} viewBox={viewBox} style={iconStyle}></SvgIcon>;

  const zapperCredit = (
    <Box display="flex" alignItems="center" justifyContent="center" paddingTop="32px" width="100%">
      <SvgIcon component={ZapperIcon} viewBox="85 0 100 80" style={{ width: "200px", height: "40px" }} />
    </Box>
  );

  const [customSlippage, setCustomSlippage] = useState<string>("1.0");

  const onZap = async () => {
    if (zapToken) {
      dispatch(
        executeZap({
          address,
          provider,
          slippage: customSlippage,
          sellAmount: ethers.utils.parseUnits(inputQuantity, tokens[zapToken]?.decimals),
          tokenAddress: tokens[zapToken]?.address,
          networkID: networkId,
          minimumAmount: trim(+outputQuantity * (1 - +customSlippage / 100), 2),
        }),
      );
    }
  };

  return (
    <>
      <div className="card-header">
        <Typography variant="h5">Zap</Typography>
      </div>

      <ZapStakeHeader images={inputTokenImages} />

      <Typography>
        <Trans>You Pay</Trans>
      </Typography>
      <FormControl className="zap-input" variant="outlined" color="primary">
        <InputLabel htmlFor="amount-input"></InputLabel>
        {zapToken != null ? (
          <OutlinedInput
            id="zap-amount-input"
            type="number"
            placeholder="Enter Amount"
            className="zap-input"
            disabled={zapToken == null}
            value={inputQuantity}
            onChange={e => setZapTokenQuantity(e.target.value)}
            //   labelWidth={0}
            //   label="Hello"
            endAdornment={
              <InputAdornment position="end">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minWidth: "50px",
                  }}
                >
                  {zapToken == null ? (
                    <ButtonBase onClick={handleOpen}>
                      <Box flexDirection="row" display="flex" alignItems="center">
                        <Typography>
                          <Trans>Select a Token</Trans>
                        </Typography>
                        {downIcon}
                      </Box>
                    </ButtonBase>
                  ) : (
                    <Box flexDirection="column" display="flex">
                      <Box flexDirection="row" display="flex" alignItems="center" justifyContent="flex-end">
                        <ButtonBase onClick={handleOpen}>
                          <Avatar src={tokens[zapToken]?.tokenImageUrl} style={{ height: "30px", width: "30px" }} />
                          <Box width="10px" />
                          <Typography>{tokens[zapToken]?.symbol}</Typography>
                          {downIcon}
                        </ButtonBase>
                      </Box>

                      <Box height="5px" />
                      <Box flexDirection="row" display="flex" alignItems="center">
                        <Typography color="textSecondary">{`Balance ${trim(tokens[zapToken]?.balance, 2)}`}</Typography>
                        <Box width="10px" />
                        <ButtonBase onClick={() => setZapTokenQuantity(tokens[zapToken]?.balanceRaw)}>
                          <Typography>
                            <b>Max</b>
                          </Typography>
                        </ButtonBase>
                      </Box>
                    </Box>
                  )}
                </div>
              </InputAdornment>
            }
          />
        ) : (
          <Box className="zap-input">
            <Button variant="contained" className="zap-input" onClick={handleOpen} color="primary">
              <Box flexDirection="row" display="flex" alignItems="center" justifyContent="end" flexGrow={1}>
                <Typography>
                  <Trans>Select a Token</Trans>
                </Typography>
                {downIcon}
              </Box>
            </Button>
          </Box>
        )}
      </FormControl>
      <Box marginY="12px" minHeight="24px" display="flex" justifyContent="center" alignItems="center" width="100%">
        {downIcon}
      </Box>

      <Typography>
        <Trans>You Get</Trans>
      </Typography>
      <FormControl className="zap-input" variant="outlined" color="primary">
        <InputLabel htmlFor="amount-input"></InputLabel>
        <OutlinedInput
          id="zap-amount-output"
          type="number"
          placeholder="Enter Amount"
          className="zap-input"
          value={outputQuantity}
          disabled={zapToken == null}
          onChange={e => setOutputTokenQuantity(e.target.value)}
          labelWidth={0}
          endAdornment={
            <InputAdornment position="end">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minWidth: "50px",
                }}
              >
                <Box flexDirection="column" display="flex">
                  <Box flexDirection="row" display="flex" alignItems="center" justifyContent="flex-end">
                    <Avatar
                      src="https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f.png"
                      style={{ height: "36px", width: "36px" }}
                    />
                    <Box width="10px" />
                    <Typography>sOHM</Typography>
                  </Box>
                  <Box flexDirection="row" display="flex" alignItems="center">
                    <Typography color="textSecondary">{`Balance ${trim(sOhmBalance, 2)}`}</Typography>
                  </Box>
                </Box>
              </div>
            </InputAdornment>
          }
        />
      </FormControl>
      <Box
        justifyContent="space-between"
        flexDirection="row"
        display="flex"
        width="100%"
        marginY="12px"
        alignItems="center"
      >
        <Typography>
          <Trans>Slippage Tolerance</Trans>
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography>{customSlippage}%</Typography>
          <Box width="8px" />
          <IconButton style={{ margin: 0, padding: 0 }} onClick={handleSlippageModalOpen}>
            <Icon name="settings" />
          </IconButton>
        </Box>
      </Box>
      <Box justifyContent="space-between" flexDirection="row" display="flex" width="100%" marginY="12px">
        <Typography>
          <Trans>Exchange Rate</Trans>
        </Typography>
        <Typography>
          {zapToken == null ? "nil" : `${trim(exchangeRate, 4)} ${tokens[zapToken]?.symbol}`} = 1 sOHM
        </Typography>
      </Box>
      <Box
        justifyContent="space-between"
        flexDirection="row"
        display="flex"
        marginTop="12px"
        marginBottom="36px"
        width="100%"
      >
        <Typography>
          <Trans>Minimum You Get</Trans>
        </Typography>
        <Typography>{trim(Number(outputQuantity) * (1 - +customSlippage / 100), 2)} sOHM</Typography>
      </Box>
      {initialTokenAllowance ? (
        <Button
          fullWidth
          className="zap-stake-button"
          variant="contained"
          color="primary"
          disabled={
            zapToken == null || isExecuteZapLoading || outputQuantity === "" || DISABLE_ZAPS || +outputQuantity < 0.5
          }
          onClick={onZap}
        >
          {isExecuteZapLoading ? (
            <Trans>Pending...</Trans>
          ) : outputQuantity === "" ? (
            <Trans>Enter Amount</Trans>
          ) : +outputQuantity >= 0.5 ? (
            <Trans>Zap-Stake</Trans>
          ) : (
            <Trans>Minimum Output Amount: 0.5</Trans>
          )}
        </Button>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              className="zap-stake-button"
              variant="contained"
              color="primary"
              disabled={
                zapToken == null || isTokensLoading || isAllowanceTxSuccess || isChangeAllowanceLoading || DISABLE_ZAPS
              }
              onClick={onSeekApproval}
              classes={isAllowanceTxSuccess ? { disabled: classes.ApprovedButton } : {}}
            >
              {/* {txnButtonText(pendingTransactions, approveTxnName, "Approve")} */}
              <Box display="flex" flexDirection="row">
                {isAllowanceTxSuccess ? (
                  <>
                    <SvgIcon component={CompleteStepIcon} style={buttonIconStyle} viewBox={"0 0 18 18"} />
                    <Typography classes={{ root: classes.ApprovedText }}>
                      <Trans>Approved</Trans>
                    </Typography>
                  </>
                ) : (
                  <>
                    <SvgIcon component={FirstStepIcon} style={buttonIconStyle} viewBox={"0 0 16 16"} />
                    <Typography>
                      {isChangeAllowanceLoading ? <Trans>Pending...</Trans> : <Trans>Approve</Trans>}
                    </Typography>
                  </>
                )}
              </Box>
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              className="zap-stake-button"
              variant="contained"
              color="primary"
              disabled={
                !currentTokenAllowance ||
                isExecuteZapLoading ||
                outputQuantity === "" ||
                +outputQuantity < 0.5 ||
                DISABLE_ZAPS
              }
              onClick={onZap}
            >
              <Box display="flex" flexDirection="row" alignItems="center">
                <SvgIcon component={SecondStepIcon} style={buttonIconStyle} viewBox={"0 0 16 16"} />
                <Typography>
                  {outputQuantity === "" ? (
                    <Trans>Enter Amount</Trans>
                  ) : +outputQuantity >= 0.5 ? (
                    <Trans>Zap-Stake</Trans>
                  ) : (
                    <Trans>Minimum Output Amount: 0.5</Trans>
                  )}
                </Typography>
              </Box>
            </Button>
          </Grid>
        </Grid>
      )}
      {zapperCredit}
      {SelectTokenModal(handleClose, modalOpen, isTokensLoading, tokens, handleSelectZapToken, zapperCredit)}
      {SlippageModal(handleSlippageModalClose, slippageModalOpen, customSlippage, setCustomSlippage, zapperCredit)}
    </>
  );
};

export default ZapStakeAction;
