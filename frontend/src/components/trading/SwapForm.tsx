'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { parseEther, formatEther } from 'ethers/lib/utils'
import { useAccount, useBalance } from 'wagmi'
import { toast } from 'react-hot-toast'
import { 
  useExecuteSwap, 
  useGetOptimalRoute, 
  useGetAIRecommendation,
  useTokenBalance 
} from '../../contracts/hooks'
import { tokenList, tradingConfig } from '../../config/web3'
import { SwapParams } from '../../contracts/types'

interface SwapFormData {
  tokenIn: string
  tokenOut: string
  amountIn: string
  slippage: number
  deadline: number
  useAI: boolean
  useMEVProtection: boolean
}

export function SwapForm() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [swapQuote, setSwapQuote] = useState<any>(null)
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SwapFormData>({
    defaultValues: {
      tokenIn: tokenList[0].address,
      tokenOut: tokenList[1].address,
      amountIn: '',
      slippage: tradingConfig.defaultSlippage,
      deadline: tradingConfig.defaultDeadline,
      useAI: true,
      useMEVProtection: true,
    }
  })
  
  const watchedValues = watch()
  
  // Get token balances
  const { data: tokenInBalance } = useTokenBalance(
    watchedValues.tokenIn, 
    address || ''
  )
  
  // Get optimal route
  const { data: optimalRoute } = useGetOptimalRoute(
    watchedValues.tokenIn,
    watchedValues.tokenOut,
    watchedValues.amountIn ? parseEther(watchedValues.amountIn).toString() : '0'
  )
  
  // Get AI recommendation
  const { data: aiRecommendation } = useGetAIRecommendation(
    watchedValues.tokenIn,
    watchedValues.tokenOut,
    watchedValues.amountIn ? parseEther(watchedValues.amountIn).toString() : '0'
  )
  
  // Execute swap hook
  const { write: executeSwap, isLoading: isSwapping } = useExecuteSwap()
  
  // Update quote when inputs change
  useEffect(() => {
    if (optimalRoute && watchedValues.amountIn) {
      setSwapQuote({
        route: optimalRoute,
        ai: aiRecommendation,
      })
    }
  }, [optimalRoute, aiRecommendation, watchedValues.amountIn])
  
  const onSubmit = async (data: SwapFormData) => {
    if (!address || !executeSwap) {
      toast.error('Please connect your wallet')
      return
    }
    
    try {
      setIsLoading(true)
      
      const deadline = Math.floor(Date.now() / 1000) + (data.deadline * 60)
      const amountIn = parseEther(data.amountIn)
      const minAmountOut = swapQuote?.route?.[1] || '0'
      
      const swapParams: SwapParams = {
        tokenIn: data.tokenIn,
        tokenOut: data.tokenOut,
        amountIn: amountIn.toString(),
        amountOutMin: minAmountOut,
        recipient: address,
        deadline,
        slippageTolerance: data.slippage,
      }
      
      await executeSwap({
        args: [swapParams],
        value: data.tokenIn === '0x0000000000000000000000000000000000000000' ? amountIn : undefined,
      })
      
      toast.success('Swap executed successfully!')
      setValue('amountIn', '')
      
    } catch (error: any) {
      console.error('Swap error:', error)
      toast.error(error?.message || 'Swap failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  const swapTokens = () => {
    const tokenIn = watchedValues.tokenIn
    const tokenOut = watchedValues.tokenOut
    setValue('tokenIn', tokenOut)
    setValue('tokenOut', tokenIn)
  }
  
  const setMaxAmount = () => {
    if (tokenInBalance) {
      const balance = formatEther(tokenInBalance.toString())
      // Reserve some ETH for gas if trading ETH
      const maxAmount = watchedValues.tokenIn === '0x0000000000000000000000000000000000000000' 
        ? Math.max(0, parseFloat(balance) - 0.01).toString()
        : balance
      setValue('amountIn', maxAmount)
    }
  }
  
  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Swap Tokens</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Token In */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">From</label>
          <div className="flex space-x-2">
            <select
              {...register('tokenIn', { required: 'Token is required' })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
            >
              {tokenList.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <input
              {...register('amountIn', { 
                required: 'Amount is required',
                min: { value: 0.001, message: 'Minimum amount is 0.001' }
              })}
              type="number"
              step="0.000001"
              placeholder="0.0"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              Balance: {tokenInBalance ? formatEther(tokenInBalance.toString()) : '0.00'}
            </span>
            <button
              type="button"
              onClick={setMaxAmount}
              className="text-violet-400 hover:text-violet-300"
            >
              MAX
            </button>
          </div>
          {errors.amountIn && (
            <p className="text-red-400 text-xs">{errors.amountIn.message}</p>
          )}
        </div>
        
        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={swapTokens}
            className="bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>
        
        {/* Token Out */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">To</label>
          <select
            {...register('tokenOut', { required: 'Token is required' })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
          >
            {tokenList.map(token => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
          {swapQuote && (
            <div className="text-sm text-gray-400">
              Estimated output: {formatEther(swapQuote.route?.[1] || '0')} {' '}
              {tokenList.find(t => t.address === watchedValues.tokenOut)?.symbol}
            </div>
          )}
        </div>
        
        {/* Advanced Settings */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Advanced Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Slippage (%)</label>
              <input
                {...register('slippage', { 
                  min: { value: 0.1, message: 'Minimum slippage is 0.1%' },
                  max: { value: 5, message: 'Maximum slippage is 5%' }
                })}
                type="number"
                step="0.1"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400">Deadline (min)</label>
              <input
                {...register('deadline', { 
                  min: { value: 1, message: 'Minimum deadline is 1 minute' },
                  max: { value: 60, message: 'Maximum deadline is 60 minutes' }
                })}
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm"
              />
            </div>
          </div>
          
          <div className="flex space-x-4 mt-3">
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                {...register('useAI')}
                type="checkbox"
                className="rounded border-gray-600 bg-gray-800 text-violet-600"
              />
              <span>AI Optimization</span>
            </label>
            
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                {...register('useMEVProtection')}
                type="checkbox"
                className="rounded border-gray-600 bg-gray-800 text-violet-600"
              />
              <span>MEV Protection</span>
            </label>
          </div>
        </div>
        
        {/* AI Insights */}
        {watchedValues.useAI && aiRecommendation && (
          <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-violet-300 mb-2">AI Insights</h4>
            <div className="text-xs text-gray-300 space-y-1">
              <div>Confidence: {aiRecommendation.confidenceScore}%</div>
              <div>Expected Slippage: {aiRecommendation.expectedSlippage}%</div>
              <div>Risk Level: {aiRecommendation.risks?.overallRisk || 'Unknown'}</div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSwapping || !address}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 
                     disabled:cursor-not-allowed rounded-lg p-3 text-white font-medium
                     transition-colors"
        >
          {isLoading || isSwapping ? 'Swapping...' : 'Swap'}
        </button>
      </form>
    </div>
  )
}