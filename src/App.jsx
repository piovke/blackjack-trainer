import React, { useState, useEffect, useCallback } from "react";
import { Settings2, Play, RefreshCw } from "lucide-react";

const SUITS = ["♥", "♦", "♣", "♠"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const getUpcardIndex = (val) => {
  if (["10", "J", "Q", "K"].includes(val)) return "10";
  return val;
};

const calculateScore = (hand) => {
  if (!hand || hand.length === 0) return 0;
  let score = 0;
  let aces = 0;
  for (const card of hand) {
    if (["J", "Q", "K"].includes(card.value)) score += 10;
    else if (card.value === "A") { score += 11; aces += 1; }
    else score += parseInt(card.value);
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

const isSoft17 = (hand) => {
  const score = calculateScore(hand);
  const rawScore = hand.reduce((acc, c) => acc + (["J", "Q", "K"].includes(c.value) ? 10 : c.value === "A" ? 1 : parseInt(c.value)), 0);
  return score === 17 && score !== rawScore;
};

const getCorrectAction = (hand, upcardStr, allowSurrender) => {
  if (!hand || hand.length < 2) return "Hit";
  const up = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"].indexOf(getUpcardIndex(upcardStr));
  const score = calculateScore(hand);
  const isPair = hand.length === 2 && hand[0].value === hand[1].value;
  
  const rawScore = hand.reduce((acc, c) => acc + (["J", "Q", "K"].includes(c.value) ? 10 : c.value === "A" ? 1 : parseInt(c.value)), 0);
  const isSoft = score !== rawScore;
  const canDouble = hand.length === 2;

  if (isPair) {
    const v = ["J", "Q", "K"].includes(hand[0].value) ? "10" : hand[0].value;
    const splits = {
      "A": "YYYYYYYYYY", "10": "NNNNNNNNNN", "9": "YYYYYNYYNN",
      "8": "YYYYYYYYYY", "7": "YYYYYYNNNN", "6": "YYYYYYNNNN",
      "5": "NNNNNNNNNN", "4": "NNNYYNNNNN", "3": "YYYYYYNNNN", "2": "YYYYYYNNNN"
    };
    if (splits[v][up] === "Y") return "Split";
  }

  // Poprawiony Surrender: brany pod uwagę tylko gdy dozwolony w opcjach, gracz ma 2 karty i układ NIE jest miękki (twarde 15/16)
  if (allowSurrender && hand.length === 2 && !isSoft) {
    if (score === 16 && up >= 7 && up <= 9) return "Surrender";
    if (score === 15 && up >= 8 && up <= 9) return "Surrender";
  }

  if (isSoft) {
    if (score >= 20) return "Stand";
    if (score === 19) return (up === 4 && canDouble) ? "Double" : "Stand";
    if (score === 18) {
      if (up >= 0 && up <= 4) return canDouble ? "Double" : "Stand";
      if (up === 5 || up === 6) return "Stand";
      return "Hit";
    }
    if (score === 17) return (up >= 1 && up <= 4 && canDouble) ? "Double" : "Hit";
    if (score >= 15) return (up >= 2 && up <= 4 && canDouble) ? "Double" : "Hit";
    if (score >= 13) return (up >= 3 && up <= 4 && canDouble) ? "Double" : "Hit";
  }

  if (score >= 17) return "Stand";
  if (score >= 13 && score <= 16) return up <= 4 ? "Stand" : "Hit";
  if (score === 12) return (up >= 2 && up <= 4) ? "Stand" : "Hit";
  if (score === 11) return canDouble ? "Double" : "Hit";
  if (score === 10) return (up <= 7 && canDouble) ? "Double" : "Hit";
  if (score === 9) return (up >= 1 && up <= 4 && canDouble) ? "Double" : "Hit";

  return "Hit";
};

const Card = ({ card, hidden, showCountAssist }) => {
  let countText = null;
  let countColor = "";
  
  if (showCountAssist && !hidden) {
     const v = card.value;
     if (['2','3','4','5','6'].includes(v)) { countText = "+1"; countColor = "bg-green-500"; }
     else if (['7','8','9'].includes(v)) { countText = "0"; countColor = "bg-slate-400"; }
     else { countText = "-1"; countColor = "bg-red-500"; }
  }

  if (hidden) {
    return (
      <div className="w-16 h-24 sm:w-20 sm:h-28 bg-[#3b5bdb] rounded-xl border border-[#2b44aa] shadow-md flex items-center justify-center relative overflow-hidden mt-2">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.5)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
      </div>
    );
  }
  
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div className="w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl border border-gray-200 shadow-md flex flex-col justify-between p-1 sm:p-2 font-bold text-base sm:text-lg relative z-10 mt-2">
      {showCountAssist && (
         <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${countColor} text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm z-20 border border-white`}>
            {countText}
         </div>
      )}
      <span className={isRed ? "text-red-500" : "text-slate-800"}>{card.value}</span>
      <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl ${isRed ? "text-red-500" : "text-slate-800"}`}>{card.suit}</span>
    </div>
  );
};

export default function App() {
  const [deckCount, setDeckCount] = useState(6);
  const [s17, setS17] = useState(true);
  const [showCountAssist, setShowCountAssist] = useState(false);
  const [allowSurrender, setAllowSurrender] = useState(true); // Nowa opcja ustawień
  
  const [deck, setDeck] = useState([]);
  const [initialDeckSize, setInitialDeckSize] = useState(0);
  const [discardPile, setDiscardPile] = useState([]);
  
  const [playerHands, setPlayerHands] = useState([[]]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [handStatuses, setHandStatuses] = useState(['playing']);
  
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('menu'); 
  const [message, setMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showShuffle, setShowShuffle] = useState(false);
  
  const [isCountVisible, setIsCountVisible] = useState(false);
  const [countTimeoutId, setCountTimeoutId] = useState(null);

  const generateDeck = useCallback((numDecks) => {
    let newDeck = [];
    for (let d = 0; d < numDecks; d++) {
      for (const suit of SUITS) {
        for (const value of VALUES) {
          newDeck.push({ suit, value });
        }
      }
    }
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }, []);

  const startGame = () => {
    const newDeck = generateDeck(deckCount);
    setInitialDeckSize(newDeck.length);
    const d = [...newDeck];
    const pHand = [d.pop(), d.pop()];
    const dHand = [d.pop(), d.pop()];
    setDeck(d);
    setDiscardPile([]); 
    setPlayerHands([pHand]);
    setActiveHandIndex(0);
    setHandStatuses(['playing']);
    setDealerHand(dHand);
    setGameState('playing');
  };

  const startRound = useCallback(() => {
    let currentDeck = deck;
    let shuffleNotice = false;

    if (currentDeck.length < initialDeckSize / 2) {
      currentDeck = generateDeck(deckCount);
      shuffleNotice = true;
      setDiscardPile([]); 
    } else {
      setDiscardPile(prev => [...prev, ...playerHands.flat(), ...dealerHand]);
    }

    const d = [...currentDeck];
    const pHand = [d.pop(), d.pop()];
    const dHand = [d.pop(), d.pop()];

    setDeck(d);
    setPlayerHands([pHand]);
    setActiveHandIndex(0);
    setHandStatuses(['playing']);
    setDealerHand(dHand);
    setMessage('');
    setActionMessage('');
    setShowShuffle(shuffleNotice);
    setGameState('playing');
    
    if (shuffleNotice) {
      setTimeout(() => setShowShuffle(false), 2000);
    }
  }, [deck, deckCount, initialDeckSize, generateDeck, playerHands, dealerHand]);

  const progressGame = useCallback((newStatuses) => {
    const currentStatuses = newStatuses || handStatuses;
    const nextPlayableIndex = currentStatuses.findIndex((status, idx) => status === 'playing' && idx > activeHandIndex);
    
    if (nextPlayableIndex !== -1) {
       setActiveHandIndex(nextPlayableIndex);
    } else {
       const allBustedOrSurrendered = currentStatuses.every(status => status === 'busted' || status === 'surrendered');
       if (allBustedOrSurrendered) {
           determineWinner(currentStatuses);
       } else {
           setGameState('dealerTurn');
       }
    }
  }, [activeHandIndex, handStatuses]);

  const determineWinner = useCallback((finalStatuses) => {
    const dScore = calculateScore(dealerHand);
    const statuses = finalStatuses || handStatuses;
    
    let resultMessages = [];
    playerHands.forEach((hand, idx) => {
        const status = statuses[idx];
        if (status === 'surrendered') {
            resultMessages.push(`Ręka ${idx+1}: Poddałeś się`);
        } else if (status === 'busted') {
            resultMessages.push(`Ręka ${idx+1}: Przegrałeś!`);
        } else {
            const pScore = calculateScore(hand);
            if (dScore > 21 || pScore > dScore) resultMessages.push(`Ręka ${idx+1}: Wygrałeś!`);
            else if (pScore < dScore) resultMessages.push(`Ręka ${idx+1}: Przegrałeś!`);
            else resultMessages.push(`Ręka ${idx+1}: Push!`);
        }
    });

    if (playerHands.length === 1) {
         setMessage(resultMessages[0].replace('Ręka 1: ', ''));
    } else {
         setMessage(resultMessages.join('\n'));
    }
    setGameState('gameOver');
  }, [playerHands, dealerHand, handStatuses]);

  useEffect(() => {
    if (gameState === 'dealerTurn') {
      const dScore = calculateScore(dealerHand);
      if (dScore < 17 || (!s17 && isSoft17(dealerHand))) {
        const timer = setTimeout(() => {
          const newCard = deck[deck.length - 1];
          setDeck(prev => prev.slice(0, -1));
          setDealerHand(prev => [...prev, newCard]);
        }, 800);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => determineWinner(), 400);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, dealerHand, deck, s17, determineWinner]);

  const handleAction = (action) => {
    const currentHand = playerHands[activeHandIndex];
    // Przekazanie ustawienia allowSurrender do funkcji oceniającej strategię
    const correct = getCorrectAction(currentHand, dealerHand[0].value, allowSurrender);
    const isMatch = action === correct;
    
    setActionMessage(isMatch ? "poprawny wybór ✅" : `zły wybór ❌ (powinno być: ${correct})`);
    
    let currentDeck = [...deck];
    
    if (action === 'Hit') {
      const newCard = currentDeck.pop();
      const newHand = [...currentHand, newCard];
      const newHands = [...playerHands];
      newHands[activeHandIndex] = newHand;
      
      setPlayerHands(newHands);
      setDeck(currentDeck);
      
      if (calculateScore(newHand) > 21) {
        const newStatuses = [...handStatuses];
        newStatuses[activeHandIndex] = 'busted';
        setHandStatuses(newStatuses);
        progressGame(newStatuses);
      }
    } else if (action === 'Stand') {
        const newStatuses = [...handStatuses];
        newStatuses[activeHandIndex] = 'stood';
        setHandStatuses(newStatuses);
        progressGame(newStatuses);
    } else if (action === 'Double') {
      const newCard = currentDeck.pop();
      const newHand = [...currentHand, newCard];
      const newHands = [...playerHands];
      newHands[activeHandIndex] = newHand;
      
      setPlayerHands(newHands);
      setDeck(currentDeck);
      
      const newStatuses = [...handStatuses];
      newStatuses[activeHandIndex] = calculateScore(newHand) > 21 ? 'busted' : 'stood';
      setHandStatuses(newStatuses);
      progressGame(newStatuses);
    } else if (action === 'Surrender') {
      const newStatuses = [...handStatuses];
      newStatuses[activeHandIndex] = 'surrendered';
      setHandStatuses(newStatuses);
      progressGame(newStatuses);
    } else if (action === 'Split') {
       const card1 = currentHand[0];
       const card2 = currentHand[1];
       const newCard1 = currentDeck.pop();
       const newCard2 = currentDeck.pop();
       
       const hand1 = [card1, newCard1];
       const hand2 = [card2, newCard2];
       const newHands = [...playerHands];
       newHands.splice(activeHandIndex, 1, hand1, hand2);
       
       setPlayerHands(newHands);
       setDeck(currentDeck);
       
       const newStatuses = [...handStatuses];
       newStatuses.splice(activeHandIndex, 1, 'playing', 'playing');
       setHandStatuses(newStatuses);
       
       if (card1.value === "A") {
           newStatuses[activeHandIndex] = 'stood';
           newStatuses[activeHandIndex+1] = 'stood';
           setHandStatuses(newStatuses);
           progressGame(newStatuses);
       }
    }
  };

  const getCountValues = () => {
     let rc = 0;
     const isPlaying = gameState === 'playing';
     const visibleCards = [...discardPile, ...playerHands.flat(), ...dealerHand.filter((_, idx) => !(isPlaying && idx === 1))];
     
     visibleCards.forEach(c => {
         if (['2','3','4','5','6'].includes(c.value)) rc += 1;
         else if (['10','J','Q','K','A'].includes(c.value)) rc -= 1;
     });
     
     return rc; 
  };

  const handleShowCount = () => {
      if (countTimeoutId) clearTimeout(countTimeoutId);
      setIsCountVisible(true);
      const id = setTimeout(() => {
          setIsCountVisible(false);
      }, 2000);
      setCountTimeoutId(id);
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
          <div className="flex items-center justify-center mb-6 text-blue-600">
            <Settings2 size={48} />
          </div>
          <h1 className="text-2xl font-black text-center text-slate-800 mb-8">Trening Blackjack</h1>
          
          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Liczba talii</label>
              <select 
                value={deckCount} 
                onChange={(e) => setDeckCount(Number(e.target.value))}
                className="w-full bg-slate-100 border-none rounded-xl p-3 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} talii</option>
                ))}
              </select>
            </div>
            <label className="flex items-center space-x-3 text-sm font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!s17} 
                onChange={(e) => setS17(!e.target.checked)} 
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" 
              />
              <span>Krupier dobiera na miękkiej 17 (H17)</span>
            </label>
            <label className="flex items-center space-x-3 text-sm font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={allowSurrender} 
                onChange={(e) => setAllowSurrender(e.target.checked)} 
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" 
              />
              <span>Dozwolony Surrender (Poddanie)</span>
            </label>
            <label className="flex items-center space-x-3 text-sm font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showCountAssist} 
                onChange={(e) => setShowCountAssist(e.target.checked)} 
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" 
              />
              <span>Wspomaganie liczenia kart (+ / 0 / -)</span>
            </label>
          </div>

          <button 
            onClick={startGame}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <Play size={20} fill="currentColor" />
            <span>Rozpocznij Trening</span>
          </button>
        </div>
      </div>
    );
  }

  const isPlaying = gameState === 'playing';
  const currentRC = getCountValues();
  const rcDisplay = currentRC > 0 ? `+${currentRC}` : currentRC.toString();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Krupier - Górna Sekcja */}
      <div className="bg-[#eef2f6] rounded-b-[2.5rem] pt-8 pb-6 flex flex-col items-center shadow-sm">
        <h2 className="text-slate-500 font-bold tracking-widest text-sm mb-2">KRUPIER</h2>
        <div className="flex justify-center min-h-[120px] relative w-full">
            {dealerHand.map((card, idx) => (
                <div 
                    key={idx} 
                    className="absolute"
                    style={{
                        left: `calc(50% - 32px + ${idx * 30}px)`, 
                        zIndex: idx 
                    }}
                >
                <Card card={card} hidden={isPlaying && idx === 1} showCountAssist={showCountAssist} />
                </div>
            ))}
        </div>
        <div className="mt-4 bg-white px-5 py-1.5 rounded-full text-slate-700 font-bold shadow-sm text-sm z-10 relative">
          Suma: {isPlaying ? calculateScore([dealerHand[0]]) : calculateScore(dealerHand)}
        </div>
      </div>

      {/* Środek - Elastyczna sekcja oddzielająca */}
      <div className="flex-1 flex items-center px-4 sm:px-6 w-full max-w-md mx-auto">
        <div className="w-20 flex justify-start">
           <button 
             onClick={handleShowCount}
             className="bg-slate-200 text-slate-600 font-black py-2.5 px-2 rounded-xl text-xs sm:text-sm shadow-sm active:scale-95 transition-transform w-16 sm:w-20 text-center"
           >
             {isCountVisible ? rcDisplay : "COUNT"}
           </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center min-h-[80px] text-center px-2">
          {actionMessage && (
            <div className={`text-sm font-bold ${actionMessage.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
              {actionMessage}
            </div>
          )}
          {message && <div className="text-lg font-black text-slate-800 mt-1 whitespace-pre-line">{message}</div>}
          {showShuffle && <div className="text-blue-500 font-bold animate-pulse mt-1 text-sm">Tasowanie kart...</div>}
        </div>

        <div className="w-20 flex justify-end">
          {gameState === 'gameOver' && (
            <button 
              onClick={startRound} 
              className="bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 active:scale-90 transition-transform"
            >
              <RefreshCw size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Gracz - Dolna Sekcja */}
      <div className="flex flex-col items-center px-4 pb-6 w-full max-w-md mx-auto">
        <h2 className="text-slate-500 font-bold tracking-widest text-sm mb-2">TWOJE KARTY</h2>
        
        <div className="flex flex-row justify-center w-full gap-8 sm:gap-12 mb-4">
            {playerHands.map((hand, handIdx) => (
               <div key={handIdx} className={`flex flex-col items-center transition-opacity duration-300 ${activeHandIndex !== handIdx && isPlaying ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}`}>
                   {playerHands.length > 1 && (
                       <span className="text-xs font-bold text-slate-400 mb-1">RĘKA {handIdx + 1}</span>
                   )}
                   <div className="flex justify-center min-h-[120px] relative w-24">
                        {hand.map((card, idx) => (
                            <div 
                                key={idx} 
                                className="absolute"
                                style={{ 
                                    left: `calc(50% - 32px + ${idx * 25}px)`, 
                                    zIndex: idx 
                                }}
                            >
                            <Card card={card} hidden={false} showCountAssist={showCountAssist} />
                            </div>
                        ))}
                    </div>
                    <div className="bg-[#1e2336] text-white px-4 py-1 rounded-full font-bold mt-2 shadow-md text-xs z-10 relative">
                      Suma: {calculateScore(hand)}
                    </div>
               </div>
            ))}
        </div>

        {/* Panel Przycisków */}
        <div className="w-full bg-[#1e2336] rounded-3xl p-4 shadow-xl z-20 relative mt-2">
          <div className="flex gap-3 mb-3">
            <button 
              disabled={!isPlaying || handStatuses[activeHandIndex] !== 'playing'}
              onClick={() => handleAction('Hit')}
              className="flex-1 bg-[#22c55e] text-white py-4 rounded-xl font-bold tracking-wide active:scale-95 transition-transform disabled:opacity-50"
            >
              HIT
            </button>
            <button 
              disabled={!isPlaying || handStatuses[activeHandIndex] !== 'playing'}
              onClick={() => handleAction('Stand')}
              className="flex-1 bg-[#f43f5e] text-white py-4 rounded-xl font-bold tracking-wide active:scale-95 transition-transform disabled:opacity-50"
            >
              STAND
            </button>
          </div>
          <div className="flex gap-3">
            <button 
              disabled={!isPlaying || handStatuses[activeHandIndex] !== 'playing' || playerHands[activeHandIndex].length > 2}
              onClick={() => handleAction('Double')}
              className="flex-1 bg-[#f59e0b] text-white py-3 rounded-xl font-bold text-[11px] active:scale-95 transition-transform disabled:opacity-50"
            >
              DOUBLE
            </button>
            <button 
              disabled={!isPlaying || handStatuses[activeHandIndex] !== 'playing' || playerHands[activeHandIndex].length > 2 || playerHands[activeHandIndex][0].value !== playerHands[activeHandIndex][1].value}
              onClick={() => handleAction('Split')}
              className="flex-1 bg-[#3b82f6] text-white py-3 rounded-xl font-bold text-[11px] active:scale-95 transition-transform disabled:opacity-50"
            >
              SPLIT
            </button>
            <button 
              // Przycisk jest zablokowany jeśli allowSurrender === false
              disabled={!allowSurrender || !isPlaying || handStatuses[activeHandIndex] !== 'playing' || playerHands[activeHandIndex].length > 2 || playerHands.length > 1}
              onClick={() => handleAction('Surrender')}
              className="flex-1 bg-[#a855f7] text-white py-3 rounded-xl font-bold text-[11px] active:scale-95 transition-transform disabled:opacity-50"
            >
              SURRENDER
            </button>
          </div>
        </div>
        <div className="h-8"></div>
      </div>
    </div>
  );
}