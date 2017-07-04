import React, { Component } from 'react'

import Datepicker from './Datepicker'
import { Dropdown } from './Dropdown'
import { Loader } from '../../../components/Loader'
import { tryGetHistoricalData, getProducts } from '../../../utils/api'
import { initWSConnection } from '../../../utils/websocket'
import PriceChart from './PriceChart'
import LineChart from './LineChart'


export default class Chart extends Component {

  constructor(props){
    super(props)
    this.state = { isFetching : false }
  }

  componentDidMount(){
    this.initData()
  }

  initData = () => {
    if(!this.props.chart.product){
      getProducts().then(products => {
        this.props.setProducts(products)
        let startDate = this.props.chart.startDate
        let endDate = this.props.chart.endDate
        let initalProduct = products.filter( p => (
          p.id === 'BTC-USD'
        ))[0]
        this.props.onSelect(initalProduct.id)
        let productIds = products.map( p => (
          p.id
        ))
        initWSConnection(productIds, this.props.setProductWSData)
        for (const product of products) {
          this.fetchProductData(product.id, startDate, endDate)
        }
      })
    }
  }

  fetchProductData = (product, startDate, endDate) => {
    tryGetHistoricalData(product, startDate, endDate).then((data) => {
      this.props.setProductData(product, data)
      this.props.onApply(startDate, endDate)
      this.setState(() => (
        { isFetching: false }
      ))
    })
  }

  onApply = (startDate, endDate) => {
    this.setState(() => (
      { isFetching: true }
    ))
    this.fetchProductData(this.props.chart.product, startDate, endDate)
  }

  onChange = (event) => {
    if (event) {
      this.props.onSelect(event.value)
    }
  }

  render() {

    let dateRange = { startDate: this.props.chart.startDate, endDate: this.props.chart.endDate }

    let selectedProductHasData = this.props.chart.products.length > 0 ? this.props.chart.products.filter( product => {
      return product.id === this.props.chart.product && product.data
    }).length > 0 : false

    let selectedProduct = this.props.chart.products.length > 0 && this.props.chart.product ?  this.props.chart.products.filter( product => (
      product.id === this.props.chart.product
    ))[0] : ''

    let selectedProductData = selectedProduct.data ? selectedProduct.data.map(d => (
      [ d.time, d.open, d.high, d.low, d.close ]
    )) : []

    let selectedProductWSData = selectedProduct.ws_data ? selectedProduct.ws_data.map(d => (
      [ d.time, d.price ]
    )) : []

    let config = {
      rangeSelector: {
        selected: 1
      },
      title: {
        text: selectedProduct.display_name
      },
      series: [{
        name: selectedProduct.display_name,
        data: selectedProductData,
        type: 'candlestick',
        tooltip: {
          valueDecimals: 2
        }
      }],
      scrollbar: {
        enabled: false
      },
      pane: {
        background: {
          borderWidth: 0
        }
      }
    }

    let wsConfig = {
      series: [{
        data: selectedProductWSData,
        type: 'line',
        tooltip: {
          valueDecimals: 2
        }
      }],
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      pane: {
        background: {
          borderWidth: 0
        }
      },
      chart: {
        height: '129%'
      }
    }

    let dropdownOptions = this.props.chart.products.map(product => {
      return { value: product.id, label: product.display_name}
    })

    return (
       <div style={{width: 950,height: 420}}>
         <div className='dropdown'>
           <Dropdown
            options={dropdownOptions}
            onChange={this.onChange}
            value={this.props.chart.product}
          />
         </div>
         <div className='date-picker'>
           <Datepicker
              startDate={this.props.chart.startDate}
              endDate={this.props.chart.endDate}
              onApply={this.onApply}
              isFetching={this.state.isFetching}
            />
         </div>
         { selectedProductHasData ?
           <div>
             <PriceChart dateRange={dateRange} config={config} />
             <LineChart config={wsConfig} />
           </div>
         :<div>
            <Loader />
          </div>
        }
       </div>
      )
    }
  }
